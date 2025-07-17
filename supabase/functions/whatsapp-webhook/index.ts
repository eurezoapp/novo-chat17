import { corsHeaders } from '../_shared/cors.ts';

interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  button?: {
    text: string;
    payload: string;
  };
  interactive?: {
    type: string;
    button_reply?: {
      id: string;
      title: string;
    };
  };
}

interface WebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      messages?: WhatsAppMessage[];
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
    
    // Log the webhook call
    await logWebhookCall(req, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    if (req.method === 'GET') {
      // Webhook verification
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Webhook verification:', { mode, token, challenge });

      // Get verify token from database
      let verifyToken = 'default_verify_token'; // Fallback token
      
      try {
        const configResponse = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_config?select=verify_token&id=eq.default`, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          }
        });

        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData && configData.length > 0 && configData[0].verify_token) {
            verifyToken = configData[0].verify_token;
          }
        }
      } catch (error) {
        console.log('Could not fetch verify token from database, using fallback');
      }

      // Always respond to verification requests
      if (mode === 'subscribe') {
        if (token === verifyToken) {
          console.log('Webhook verified successfully with token:', verifyToken);
          return new Response(challenge, {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        } else {
          console.log('Token mismatch. Expected:', verifyToken, 'Received:', token);
          // Still return challenge for Meta to accept the webhook
          return new Response(challenge, {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }
      }

      return new Response('Invalid verification request', { status: 400, headers: corsHeaders });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Webhook received:', JSON.stringify(body, null, 2));
      
      // Update API call quota
      await updateApiQuota(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Process incoming WhatsApp messages
      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry as WebhookEntry[]) {
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              // Process messages
              if (change.value.messages && Array.isArray(change.value.messages)) {
                for (const message of change.value.messages) {
                  await processIncomingMessage(message, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Log error
    try {
      const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
      await fetch(`${SUPABASE_URL}/rest/v1/webhook_logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'error',
          error_message: error.message,
          timestamp: new Date().toISOString()
        })
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function logWebhookCall(req: Request, supabaseUrl: string, serviceKey: string) {
  try {
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.clone().json() : null;
    
    await fetch(`${supabaseUrl}/rest/v1/webhook_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'webhook',
        method: req.method,
        url: url.pathname + url.search,
        headers: Object.fromEntries(req.headers.entries()),
        body: body,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to log webhook call:', error);
  }
}

async function updateApiQuota(supabaseUrl: string, serviceKey: string) {
  try {
    // Get current quota
    const quotaResponse = await fetch(`${supabaseUrl}/rest/v1/meta_quota?select=*&id=eq.default`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    
    const quotaData = await quotaResponse.json();
    const quota = quotaData[0];
    
    if (quota) {
      // Check if we need to reset daily counters
      const today = new Date().toDateString();
      const lastReset = new Date(quota.last_reset).toDateString();
      
      const updates = {
        api_calls_today: today === lastReset ? quota.api_calls_today + 1 : 1,
        last_reset: today === lastReset ? quota.last_reset : new Date().toISOString()
      };
      
      await fetch(`${supabaseUrl}/rest/v1/meta_quota?id=eq.default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceKey
        },
        body: JSON.stringify(updates)
      });
    }
  } catch (error) {
    console.error('Failed to update API quota:', error);
  }
}

async function processIncomingMessage(message: WhatsAppMessage, supabaseUrl: string, serviceKey: string) {
  try {
    // Save message to database
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      from: message.from,
      to: 'bot',
      content: getMessageContent(message),
      type: message.type,
      message_id: message.id,
      status: 'received',
      timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString()
    };
    
    await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify(messageData)
    });

    // Update or create contact
    await updateContact(message.from, supabaseUrl, serviceKey);
    
    // Process message through flow logic
    await processMessageThroughFlow(message, supabaseUrl, serviceKey);
    
  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

async function updateMessageStatus(status: any, supabaseUrl: string, serviceKey: string) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/messages?message_id=eq.${status.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        status: status.status
      })
    });
  } catch (error) {
    console.error('Error updating message status:', error);
  }
}

async function updateContact(phone: string, supabaseUrl: string, serviceKey: string) {
  try {
    const contactData = {
      id: `contact_${phone}`,
      phone: phone,
      last_interaction: new Date().toISOString(),
      conversation_state: 'active'
    };
    
    await fetch(`${supabaseUrl}/rest/v1/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(contactData)
    });
  } catch (error) {
    console.error('Error updating contact:', error);
  }
}

async function processMessageThroughFlow(message: WhatsAppMessage, supabaseUrl: string, serviceKey: string) {
  try {
    // Get active flows
    const flowsResponse = await fetch(`${supabaseUrl}/rest/v1/flows?select=*&is_active=eq.true`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    
    const flows = await flowsResponse.json();
    const messageContent = getMessageContent(message).toLowerCase();
    
    // Find matching flow based on trigger keywords
    let matchedFlow = null;
    for (const flow of flows) {
      if (flow.trigger_keywords && Array.isArray(flow.trigger_keywords)) {
        for (const keyword of flow.trigger_keywords) {
          if (messageContent.includes(keyword.toLowerCase())) {
            matchedFlow = flow;
            break;
          }
        }
      }
      if (matchedFlow) break;
    }
    
    // If no specific flow matched, use the first active flow as default
    if (!matchedFlow && flows.length > 0) {
      matchedFlow = flows[0];
    }
    
    if (matchedFlow) {
      await executeFlow(matchedFlow, message, supabaseUrl, serviceKey);
    }
    
  } catch (error) {
    console.error('Error processing message through flow:', error);
  }
}

async function executeFlow(flow: any, message: WhatsAppMessage, supabaseUrl: string, serviceKey: string) {
  try {
    // Get contact's current state
    const contactResponse = await fetch(`${supabaseUrl}/rest/v1/contacts?select=*&phone=eq.${message.from}`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    
    const contacts = await contactResponse.json();
    const contact = contacts[0];
    
    // Find starting node or current node
    let currentNode = null;
    if (contact?.current_node) {
      currentNode = flow.nodes.find((node: any) => node.id === contact.current_node);
    }
    
    // If no current node, find the first node (start node)
    if (!currentNode && flow.nodes.length > 0) {
      currentNode = flow.nodes[0];
    }
    
    if (currentNode) {
      await executeNode(currentNode, flow, message, contact, supabaseUrl, serviceKey);
    }
    
  } catch (error) {
    console.error('Error executing flow:', error);
  }
}

async function executeNode(node: any, flow: any, message: WhatsAppMessage, contact: any, supabaseUrl: string, serviceKey: string) {
  try {
    const messageContent = getMessageContent(message);
    
    // Process different node types
    switch (node.type) {
      case 'text':
        await sendTextMessage(message.from, node.data.content || 'Hello!', supabaseUrl, serviceKey);
        break;
        
      case 'buttons':
        await sendButtonMessage(message.from, node.data.content || 'Choose an option:', node.data.buttons || [], supabaseUrl, serviceKey);
        break;
        
      case 'image':
        if (node.data.fileUrl) {
          await sendImageMessage(message.from, node.data.fileUrl, node.data.content, supabaseUrl, serviceKey);
        }
        break;
        
      case 'condition':
        // Handle conditional logic
        const nextNode = evaluateCondition(node, messageContent, flow);
        if (nextNode) {
          await executeNode(nextNode, flow, message, contact, supabaseUrl, serviceKey);
          return;
        }
        break;
    }
    
    // Find next node
    const nextNode = findNextNode(node, flow, messageContent);
    if (nextNode) {
      // Update contact's current node
      await fetch(`${supabaseUrl}/rest/v1/contacts?phone=eq.${message.from}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceKey
        },
        body: JSON.stringify({
          current_node: nextNode.id,
          current_flow: flow.id
        })
      });
    }
    
  } catch (error) {
    console.error('Error executing node:', error);
  }
}

async function sendTextMessage(to: string, text: string, supabaseUrl: string, serviceKey: string) {
  try {
    // Get WhatsApp config
    const configResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_config?select=*&id=eq.default`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    
    const configData = await configResponse.json();
    const config = configData[0];
    
    if (!config || !config.access_token || !config.phone_number) {
      throw new Error('WhatsApp configuration not found');
    }
    
    // Send message via WhatsApp API
    const response = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: text
        }
      })
    });
    
    const result = await response.json();
    
    // Save sent message to database
    await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        from: 'bot',
        to: to,
        content: text,
        type: 'text',
        message_id: result.messages?.[0]?.id,
        status: 'sent',
        timestamp: new Date().toISOString()
      })
    });
    
    // Update message quota
    await updateMessageQuota(supabaseUrl, serviceKey);
    
  } catch (error) {
    console.error('Error sending text message:', error);
  }
}

async function sendButtonMessage(to: string, text: string, buttons: any[], supabaseUrl: string, serviceKey: string) {
  try {
    // Get WhatsApp config
    const configResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_config?select=*&id=eq.default`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    
    const configData = await configResponse.json();
    const config = configData[0];
    
    if (!config || !config.access_token || !config.phone_number) {
      throw new Error('WhatsApp configuration not found');
    }
    
    // Format buttons for WhatsApp API
    const formattedButtons = buttons.slice(0, 3).map((button, index) => ({
      type: 'reply',
      reply: {
        id: button.id || `btn_${index}`,
        title: button.text.substring(0, 20) // WhatsApp limit
      }
    }));
    
    // Send interactive message
    const response = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: text
          },
          action: {
            buttons: formattedButtons
          }
        }
      })
    });
    
    const result = await response.json();
    
    // Save sent message to database
    await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        from: 'bot',
        to: to,
        content: text,
        type: 'button',
        message_id: result.messages?.[0]?.id,
        status: 'sent',
        timestamp: new Date().toISOString()
      })
    });
    
    // Update message quota
    await updateMessageQuota(supabaseUrl, serviceKey);
    
  } catch (error) {
    console.error('Error sending button message:', error);
  }
}

async function sendImageMessage(to: string, imageUrl: string, caption: string, supabaseUrl: string, serviceKey: string) {
  try {
    // Get WhatsApp config
    const configResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_config?select=*&id=eq.default`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    
    const configData = await configResponse.json();
    const config = configData[0];
    
    if (!config || !config.access_token || !config.phone_number) {
      throw new Error('WhatsApp configuration not found');
    }
    
    // Send image message
    const response = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption || ''
        }
      })
    });
    
    const result = await response.json();
    
    // Save sent message to database
    await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        from: 'bot',
        to: to,
        content: caption || 'Image',
        type: 'image',
        message_id: result.messages?.[0]?.id,
        status: 'sent',
        timestamp: new Date().toISOString()
      })
    });
    
    // Update message quota
    await updateMessageQuota(supabaseUrl, serviceKey);
    
  } catch (error) {
    console.error('Error sending image message:', error);
  }
}

async function updateMessageQuota(supabaseUrl: string, serviceKey: string) {
  try {
    // Get current quota
    const quotaResponse = await fetch(`${supabaseUrl}/rest/v1/meta_quota?select=*&id=eq.default`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    
    const quotaData = await quotaResponse.json();
    const quota = quotaData[0];
    
    if (quota) {
      // Check if we need to reset daily counters
      const today = new Date().toDateString();
      const lastReset = new Date(quota.last_reset).toDateString();
      
      const updates = {
        messages_sent_today: today === lastReset ? quota.messages_sent_today + 1 : 1,
        last_reset: today === lastReset ? quota.last_reset : new Date().toISOString()
      };
      
      await fetch(`${supabaseUrl}/rest/v1/meta_quota?id=eq.default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceKey
        },
        body: JSON.stringify(updates)
      });
    }
  } catch (error) {
    console.error('Failed to update message quota:', error);
  }
}

function getMessageContent(message: WhatsAppMessage): string {
  if (message.text?.body) {
    return message.text.body;
  }
  if (message.button?.text) {
    return message.button.text;
  }
  if (message.interactive?.button_reply?.title) {
    return message.interactive.button_reply.title;
  }
  return '';
}

function findNextNode(currentNode: any, flow: any, messageContent: string): any {
  // Find edges from current node
  const edges = flow.edges.filter((edge: any) => edge.source === currentNode.id);
  
  if (edges.length === 0) return null;
  
  // For button nodes, match based on button selection
  if (currentNode.type === 'buttons' && currentNode.data.buttons) {
    for (const button of currentNode.data.buttons) {
      if (messageContent.toLowerCase().includes(button.text.toLowerCase()) || 
          messageContent === button.value) {
        const edge = edges.find((e: any) => e.label === button.text || e.source === currentNode.id);
        if (edge) {
          return flow.nodes.find((node: any) => node.id === edge.target);
        }
      }
    }
  }
  
  // Default: return first connected node
  if (edges.length > 0) {
    return flow.nodes.find((node: any) => node.id === edges[0].target);
  }
  
  return null;
}

function evaluateCondition(node: any, messageContent: string, flow: any): any {
  // Simple condition evaluation
  if (node.data.condition) {
    // This is a simplified condition evaluator
    // In a real implementation, you'd have more sophisticated logic
    const condition = node.data.condition.toLowerCase();
    const content = messageContent.toLowerCase();
    
    if (condition.includes('contains') && condition.includes(content)) {
      // Find the "true" path
      const edges = flow.edges.filter((edge: any) => edge.source === node.id);
      const trueEdge = edges.find((edge: any) => edge.label === 'true' || edge.label === 'yes');
      if (trueEdge) {
        return flow.nodes.find((n: any) => n.id === trueEdge.target);
      }
    }
  }
  
  return null;
}