import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GHLClient } from "./ghl-client.js";

const API_KEY = process.env.GHL_API_KEY;
const LOCATION_ID = process.env.GHL_LOCATION_ID;
if (!API_KEY || !LOCATION_ID) { console.error("GHL_API_KEY and GHL_LOCATION_ID environment variables are required"); process.exit(1); }

const ghl = new GHLClient(API_KEY, LOCATION_ID);
const server = new McpServer({ name: "ghl-mcp-server", version: "2.0.0" });

function json(data) { return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }; }
async function handle(fn) { try { return json(await fn()); } catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; } }

// ==================== CONTACTS ====================

server.tool("ghl_get_contacts", "List contacts with optional filters", {
  query: z.string().optional().describe("Search query string"),
  page: z.number().optional(),
  limit: z.number().optional(),
}, async (params) => handle(() => ghl.getContacts(params)));

server.tool("ghl_get_contact", "Get a single contact by ID", {
  contactId: z.string().describe("Contact ID"),
}, async ({ contactId }) => handle(() => ghl.getContact(contactId)));

server.tool("ghl_create_contact", "Create a new contact", {
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  customFields: z.string().optional().describe("JSON string of custom field values"),
}, async (params) => {
  const data = { ...params };
  if (data.customFields) data.customFields = JSON.parse(data.customFields);
  return handle(() => ghl.createContact(data));
});

server.tool("ghl_update_contact", "Update an existing contact", {
  contactId: z.string().describe("Contact ID"),
  data: z.string().describe("JSON string of fields to update (firstName, lastName, email, phone, tags, etc.)"),
}, async ({ contactId, data }) => handle(() => ghl.updateContact(contactId, JSON.parse(data))));

server.tool("ghl_delete_contact", "Delete a contact", {
  contactId: z.string().describe("Contact ID"),
}, async ({ contactId }) => handle(() => ghl.deleteContact(contactId)));

server.tool("ghl_search_contacts", "Search contacts with filters (query, email, phone, tags, etc.)", {
  query: z.string().optional().describe("Search query string"),
  page: z.number().optional().describe("Page number (default 1)"),
  pageLimit: z.number().optional().describe("Results per page (default 20)"),
  filters: z.string().optional().describe("JSON string of search filters: {email, phone, tags, country, companyName, etc.}"),
}, async ({ query, page, pageLimit, filters }) => {
  const body = { locationId: LOCATION_ID, page: page || 1, pageLimit: pageLimit || 20 };
  if (query) body.query = query;
  if (filters) Object.assign(body, JSON.parse(filters));
  return handle(() => ghl.searchContacts(body));
});

server.tool("ghl_upsert_contact", "Create or update contact (matched by email/phone)", {
  email: z.string().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  customFields: z.string().optional().describe("JSON string of custom field values"),
}, async (params) => {
  const data = { ...params };
  if (data.customFields) data.customFields = JSON.parse(data.customFields);
  return handle(() => ghl.upsertContact(data));
});

server.tool("ghl_get_duplicate_contact", "Find duplicate contact by email, phone, or both", {
  email: z.string().optional(),
  phone: z.string().optional(),
}, async (params) => handle(() => ghl.getDuplicateContact(params)));

server.tool("ghl_bulk_update_contact_tags", "Bulk add or remove tags from contacts", {
  type: z.enum(["add", "remove"]).describe("Whether to add or remove tags"),
  data: z.string().describe("JSON string with {contactIds: [...], tags: [...]}"),
}, async ({ type, data }) => handle(() => ghl.bulkUpdateContactTags(type, JSON.parse(data))));

server.tool("ghl_add_contact_tags", "Add tags to a contact", {
  contactId: z.string(),
  tags: z.array(z.string()),
}, async ({ contactId, tags }) => handle(() => ghl.addContactTags(contactId, tags)));

server.tool("ghl_remove_contact_tags", "Remove tags from a contact", {
  contactId: z.string(),
  tags: z.array(z.string()),
}, async ({ contactId, tags }) => handle(() => ghl.removeContactTags(contactId, tags)));

server.tool("ghl_add_contact_to_workflow", "Add a contact to a workflow", {
  contactId: z.string(),
  workflowId: z.string(),
}, async ({ contactId, workflowId }) => handle(() => ghl.addContactToWorkflow(contactId, workflowId)));

server.tool("ghl_remove_contact_from_workflow", "Remove a contact from a workflow", {
  contactId: z.string(),
  workflowId: z.string(),
}, async ({ contactId, workflowId }) => handle(() => ghl.removeContactFromWorkflow(contactId, workflowId)));

server.tool("ghl_add_contact_to_campaign", "Add a contact to a campaign", {
  contactId: z.string(),
  campaignId: z.string(),
}, async ({ contactId, campaignId }) => handle(() => ghl.addContactToCampaign(contactId, campaignId)));

server.tool("ghl_remove_contact_from_campaign", "Remove a contact from a campaign", {
  contactId: z.string(),
  campaignId: z.string(),
}, async ({ contactId, campaignId }) => handle(() => ghl.removeContactFromCampaign(contactId, campaignId)));

server.tool("ghl_remove_contact_from_all_campaigns", "Remove a contact from all campaigns", {
  contactId: z.string(),
}, async ({ contactId }) => handle(() => ghl.removeContactFromAllCampaigns(contactId)));

server.tool("ghl_add_contact_followers", "Add followers to a contact", {
  contactId: z.string(),
  data: z.string().describe("JSON string with {followers: [userIds]}"),
}, async ({ contactId, data }) => handle(() => ghl.addContactFollowers(contactId, JSON.parse(data))));

server.tool("ghl_remove_contact_followers", "Remove followers from a contact", {
  contactId: z.string(),
  data: z.string().describe("JSON string with {followers: [userIds]}"),
}, async ({ contactId, data }) => handle(() => ghl.removeContactFollowers(contactId, JSON.parse(data))));

server.tool("ghl_get_contact_appointments", "Get appointments for a contact", {
  contactId: z.string(),
}, async ({ contactId }) => handle(() => ghl.getContactAppointments(contactId)));

// Contact Notes
server.tool("ghl_get_contact_notes", "Get all notes for a contact", {
  contactId: z.string(),
}, async ({ contactId }) => handle(() => ghl.getContactNotes(contactId)));

server.tool("ghl_create_contact_note", "Create a note on a contact", {
  contactId: z.string(),
  body: z.string().describe("Note content"),
}, async ({ contactId, body }) => handle(() => ghl.createContactNote(contactId, { body })));

server.tool("ghl_update_contact_note", "Update a note on a contact", {
  contactId: z.string(),
  noteId: z.string(),
  body: z.string().describe("Updated note content"),
}, async ({ contactId, noteId, body }) => handle(() => ghl.updateContactNote(contactId, noteId, { body })));

server.tool("ghl_delete_contact_note", "Delete a note from a contact", {
  contactId: z.string(),
  noteId: z.string(),
}, async ({ contactId, noteId }) => handle(() => ghl.deleteContactNote(contactId, noteId)));

// Contact Tasks
server.tool("ghl_get_contact_tasks", "Get all tasks for a contact", {
  contactId: z.string(),
}, async ({ contactId }) => handle(() => ghl.getContactTasks(contactId)));

server.tool("ghl_create_contact_task", "Create a task for a contact", {
  contactId: z.string(),
  title: z.string(),
  body: z.string().optional(),
  dueDate: z.string().optional().describe("ISO date string"),
  completed: z.boolean().optional(),
  assignedTo: z.string().optional().describe("User ID to assign task to"),
}, async ({ contactId, ...data }) => handle(() => ghl.createContactTask(contactId, data)));

server.tool("ghl_update_contact_task", "Update a task on a contact", {
  contactId: z.string(),
  taskId: z.string(),
  data: z.string().describe("JSON string of fields to update (title, body, dueDate, completed, assignedTo)"),
}, async ({ contactId, taskId, data }) => handle(() => ghl.updateContactTask(contactId, taskId, JSON.parse(data))));

server.tool("ghl_delete_contact_task", "Delete a task from a contact", {
  contactId: z.string(),
  taskId: z.string(),
}, async ({ contactId, taskId }) => handle(() => ghl.deleteContactTask(contactId, taskId)));

server.tool("ghl_complete_contact_task", "Mark a contact task as completed", {
  contactId: z.string(),
  taskId: z.string(),
  completed: z.boolean().describe("Whether the task is completed"),
}, async ({ contactId, taskId, completed }) => handle(() => ghl.completeContactTask(contactId, taskId, { completed })));

// ==================== CONVERSATIONS ====================

server.tool("ghl_search_conversations", "Search conversations", {
  contactId: z.string().optional(),
  query: z.string().optional(),
  status: z.string().optional().describe("all, read, unread, starred"),
}, async (params) => handle(() => ghl.searchConversations(params)));

server.tool("ghl_get_conversation", "Get a conversation by ID", {
  conversationId: z.string(),
}, async ({ conversationId }) => handle(() => ghl.getConversation(conversationId)));

server.tool("ghl_create_conversation", "Create a new conversation", {
  contactId: z.string(),
}, async ({ contactId }) => handle(() => ghl.createConversation({ contactId })));

server.tool("ghl_update_conversation", "Update a conversation (star, unread, etc.)", {
  conversationId: z.string(),
  data: z.string().describe("JSON string of fields to update (starred, unreadCount, etc.)"),
}, async ({ conversationId, data }) => handle(() => ghl.updateConversation(conversationId, JSON.parse(data))));

server.tool("ghl_delete_conversation", "Delete a conversation", {
  conversationId: z.string(),
}, async ({ conversationId }) => handle(() => ghl.deleteConversation(conversationId)));

server.tool("ghl_get_messages", "Get messages in a conversation", {
  conversationId: z.string(),
  lastMessageId: z.string().optional().describe("For pagination"),
  limit: z.number().optional(),
}, async ({ conversationId, ...query }) => handle(() => ghl.getMessages(conversationId, query)));

server.tool("ghl_send_message", "Send SMS, Email, or other message", {
  type: z.enum(["SMS", "Email", "Live_Chat", "WhatsApp", "FB", "IG", "Custom"]).describe("Message type"),
  contactId: z.string(),
  message: z.string().optional().describe("Message body (for SMS/chat)"),
  subject: z.string().optional().describe("Email subject"),
  html: z.string().optional().describe("Email HTML body"),
  emailFrom: z.string().optional().describe("From name for email"),
}, async (params) => handle(() => ghl.sendMessage(params)));

server.tool("ghl_add_inbound_message", "Add an inbound message (simulate incoming message)", {
  type: z.enum(["SMS", "Email", "Live_Chat", "WhatsApp", "FB", "IG", "Custom"]).describe("Message type"),
  conversationId: z.string(),
  message: z.string().optional().describe("Message body"),
  subject: z.string().optional().describe("Email subject"),
  html: z.string().optional().describe("Email HTML body"),
}, async (params) => handle(() => ghl.addInboundMessage(params)));

server.tool("ghl_add_outbound_call", "Log an external outbound call", {
  conversationId: z.string(),
  data: z.string().describe("JSON string with call data (dispositionStatus, callDuration, etc.)"),
}, async ({ conversationId, data }) => handle(() => ghl.addOutboundCall({ conversationId, ...JSON.parse(data) })));

server.tool("ghl_get_email_by_id", "Get a specific email message by ID", {
  emailId: z.string(),
}, async ({ emailId }) => handle(() => ghl.getEmailById(emailId)));

server.tool("ghl_get_message_by_id", "Get a specific message by ID", {
  messageId: z.string(),
}, async ({ messageId }) => handle(() => ghl.getMessageById(messageId)));

server.tool("ghl_update_message_status", "Update message status (read/pending/delivered/failed)", {
  messageId: z.string(),
  status: z.enum(["read", "pending", "delivered", "failed"]),
}, async ({ messageId, status }) => handle(() => ghl.updateMessageStatus(messageId, { status })));

server.tool("ghl_cancel_scheduled_message", "Cancel a scheduled message", {
  messageId: z.string(),
}, async ({ messageId }) => handle(() => ghl.cancelScheduledMessage(messageId)));

server.tool("ghl_cancel_scheduled_email", "Cancel a scheduled email", {
  emailMessageId: z.string(),
}, async ({ emailMessageId }) => handle(() => ghl.cancelScheduledEmail(emailMessageId)));

server.tool("ghl_get_call_recording", "Get call recording for a message", {
  messageId: z.string(),
}, async ({ messageId }) => handle(() => ghl.getRecording(messageId)));

server.tool("ghl_get_transcription", "Get call transcription for a message", {
  messageId: z.string(),
}, async ({ messageId }) => handle(() => ghl.getTranscription(messageId)));

server.tool("ghl_upload_message_attachment", "Upload an attachment for conversations", {
  data: z.string().describe("JSON string with attachment data (conversationId, fileUrl, etc.)"),
}, async ({ data }) => handle(() => ghl.uploadMessageAttachment(JSON.parse(data))));

server.tool("ghl_send_livechat_typing", "Send typing indicator in live chat", {
  data: z.string().describe("JSON string with {conversationId, isTyping}"),
}, async ({ data }) => handle(() => ghl.sendLiveChatTyping(JSON.parse(data))));

// ==================== CALENDARS ====================

server.tool("ghl_get_calendars", "List all calendars", {}, async () => handle(() => ghl.getCalendars()));

server.tool("ghl_get_calendar", "Get a calendar by ID", {
  calendarId: z.string(),
}, async ({ calendarId }) => handle(() => ghl.getCalendar(calendarId)));

server.tool("ghl_create_calendar", "Create a new calendar", {
  data: z.string().describe("JSON string with calendar data (name, description, etc.)"),
}, async ({ data }) => handle(() => ghl.createCalendar(JSON.parse(data))));

server.tool("ghl_update_calendar", "Update a calendar", {
  calendarId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ calendarId, data }) => handle(() => ghl.updateCalendar(calendarId, JSON.parse(data))));

server.tool("ghl_delete_calendar", "Delete a calendar", {
  calendarId: z.string(),
}, async ({ calendarId }) => handle(() => ghl.deleteCalendar(calendarId)));

server.tool("ghl_get_free_slots", "Get available time slots for a calendar", {
  calendarId: z.string(),
  startDate: z.string().describe("Start date (epoch ms or ISO)"),
  endDate: z.string().describe("End date (epoch ms or ISO)"),
  timezone: z.string().optional(),
}, async ({ calendarId, ...query }) => handle(() => ghl.getFreeSlots(calendarId, query)));

server.tool("ghl_get_calendar_events", "Get calendar events", {
  startTime: z.string().optional().describe("Start time (epoch ms)"),
  endTime: z.string().optional().describe("End time (epoch ms)"),
  calendarId: z.string().optional(),
  userId: z.string().optional(),
}, async (query) => handle(() => ghl.getCalendarEvents(query)));

server.tool("ghl_create_appointment", "Create a calendar appointment", {
  calendarId: z.string(),
  contactId: z.string(),
  startTime: z.string().describe("ISO date string"),
  endTime: z.string().describe("ISO date string"),
  title: z.string().optional(),
  appointmentStatus: z.string().optional().describe("confirmed, cancelled, showed, noshow, invalid"),
  assignedUserId: z.string().optional(),
  notes: z.string().optional(),
}, async (params) => handle(() => ghl.createAppointment({ locationId: LOCATION_ID, ...params })));

server.tool("ghl_get_appointment", "Get an appointment by ID", {
  eventId: z.string(),
}, async ({ eventId }) => handle(() => ghl.getAppointment(eventId)));

server.tool("ghl_update_appointment", "Update an appointment", {
  eventId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ eventId, data }) => handle(() => ghl.updateAppointment(eventId, JSON.parse(data))));

server.tool("ghl_delete_event", "Delete a calendar event", {
  eventId: z.string(),
}, async ({ eventId }) => handle(() => ghl.deleteEvent(eventId)));

server.tool("ghl_create_block_slot", "Create a blocked time slot on a calendar", {
  data: z.string().describe("JSON string with block slot data (calendarId, startTime, endTime, title, etc.)"),
}, async ({ data }) => handle(() => ghl.createBlockSlot(JSON.parse(data))));

server.tool("ghl_update_block_slot", "Update a blocked time slot", {
  slotId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ slotId, data }) => handle(() => ghl.updateBlockSlot(slotId, JSON.parse(data))));

server.tool("ghl_get_blocked_slots", "Get blocked time slots", {
  calendarId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
}, async (params) => handle(() => ghl.getBlockedSlots(params)));

// Calendar Groups
server.tool("ghl_get_calendar_groups", "Get calendar groups", {}, async () => handle(() => ghl.getCalendarGroups()));

server.tool("ghl_create_calendar_group", "Create a calendar group", {
  data: z.string().describe("JSON string with calendar group data (name, description, calendarIds, etc.)"),
}, async ({ data }) => handle(() => ghl.createCalendarGroup(JSON.parse(data))));

server.tool("ghl_update_calendar_group", "Update a calendar group", {
  groupId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ groupId, data }) => handle(() => ghl.updateCalendarGroup(groupId, JSON.parse(data))));

server.tool("ghl_delete_calendar_group", "Delete a calendar group", {
  groupId: z.string(),
}, async ({ groupId }) => handle(() => ghl.deleteCalendarGroup(groupId)));

server.tool("ghl_disable_calendar_group", "Enable or disable a calendar group", {
  groupId: z.string(),
  data: z.string().describe("JSON string with {isActive: boolean}"),
}, async ({ groupId, data }) => handle(() => ghl.disableCalendarGroup(groupId, JSON.parse(data))));

server.tool("ghl_validate_group_slug", "Validate a calendar group slug", {
  slug: z.string().describe("Slug to validate"),
}, async ({ slug }) => handle(() => ghl.validateGroupSlug({ slug })));

// Calendar Resources
server.tool("ghl_list_calendar_resources", "List calendar resources by type", {
  resourceType: z.string().describe("Resource type (e.g. equipments, rooms)"),
}, async ({ resourceType }) => handle(() => ghl.listCalendarResources(resourceType)));

server.tool("ghl_create_calendar_resource", "Create a calendar resource", {
  resourceType: z.string().describe("Resource type"),
  data: z.string().describe("JSON string with resource data"),
}, async ({ resourceType, data }) => handle(() => ghl.createCalendarResource(resourceType, JSON.parse(data))));

server.tool("ghl_get_calendar_resource", "Get a calendar resource by type and ID", {
  resourceType: z.string(),
  resourceId: z.string(),
}, async ({ resourceType, resourceId }) => handle(() => ghl.getCalendarResource(resourceType, resourceId)));

server.tool("ghl_update_calendar_resource", "Update a calendar resource", {
  resourceType: z.string(),
  resourceId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ resourceType, resourceId, data }) => handle(() => ghl.updateCalendarResource(resourceType, resourceId, JSON.parse(data))));

server.tool("ghl_delete_calendar_resource", "Delete a calendar resource", {
  resourceType: z.string(),
  resourceId: z.string(),
}, async ({ resourceType, resourceId }) => handle(() => ghl.deleteCalendarResource(resourceType, resourceId)));

// Calendar Notifications
server.tool("ghl_get_calendar_notifications", "Get notifications for a calendar", {
  calendarId: z.string(),
}, async ({ calendarId }) => handle(() => ghl.getCalendarNotifications(calendarId)));

server.tool("ghl_create_calendar_notification", "Create a notification for a calendar", {
  calendarId: z.string(),
  data: z.string().describe("JSON string with notification data"),
}, async ({ calendarId, data }) => handle(() => ghl.createCalendarNotification(calendarId, JSON.parse(data))));

server.tool("ghl_update_calendar_notification", "Update a calendar notification", {
  calendarId: z.string(),
  notificationId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ calendarId, notificationId, data }) => handle(() => ghl.updateCalendarNotification(calendarId, notificationId, JSON.parse(data))));

server.tool("ghl_delete_calendar_notification", "Delete a calendar notification", {
  calendarId: z.string(),
  notificationId: z.string(),
}, async ({ calendarId, notificationId }) => handle(() => ghl.deleteCalendarNotification(calendarId, notificationId)));

// Appointment Notes
server.tool("ghl_get_appointment_notes", "Get notes for an appointment", {
  appointmentId: z.string(),
}, async ({ appointmentId }) => handle(() => ghl.getAppointmentNotes(appointmentId)));

server.tool("ghl_create_appointment_note", "Create a note on an appointment", {
  appointmentId: z.string(),
  data: z.string().describe("JSON string with note data (body, etc.)"),
}, async ({ appointmentId, data }) => handle(() => ghl.createAppointmentNote(appointmentId, JSON.parse(data))));

server.tool("ghl_update_appointment_note", "Update an appointment note", {
  appointmentId: z.string(),
  noteId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ appointmentId, noteId, data }) => handle(() => ghl.updateAppointmentNote(appointmentId, noteId, JSON.parse(data))));

server.tool("ghl_delete_appointment_note", "Delete an appointment note", {
  appointmentId: z.string(),
  noteId: z.string(),
}, async ({ appointmentId, noteId }) => handle(() => ghl.deleteAppointmentNote(appointmentId, noteId)));

// ==================== OPPORTUNITIES / PIPELINES ====================

server.tool("ghl_search_opportunities", "Search opportunities", {
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  contactId: z.string().optional(),
  query: z.string().optional(),
  status: z.string().optional().describe("open, won, lost, abandoned, all"),
  page: z.number().optional(),
  limit: z.number().optional(),
}, async (params) => handle(() => ghl.searchOpportunities(params)));

server.tool("ghl_get_opportunity", "Get an opportunity by ID", {
  id: z.string(),
}, async ({ id }) => handle(() => ghl.getOpportunity(id)));

server.tool("ghl_create_opportunity", "Create a new opportunity", {
  pipelineId: z.string(),
  name: z.string(),
  stageId: z.string(),
  contactId: z.string(),
  monetaryValue: z.number().optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
}, async (params) => handle(() => ghl.createOpportunity(params)));

server.tool("ghl_update_opportunity", "Update an opportunity", {
  id: z.string(),
  data: z.string().describe("JSON string of fields to update (name, stageId, monetaryValue, status, etc.)"),
}, async ({ id, data }) => handle(() => ghl.updateOpportunity(id, JSON.parse(data))));

server.tool("ghl_delete_opportunity", "Delete an opportunity", {
  id: z.string(),
}, async ({ id }) => handle(() => ghl.deleteOpportunity(id)));

server.tool("ghl_update_opportunity_status", "Update opportunity status (open/won/lost/abandoned)", {
  id: z.string(),
  status: z.enum(["open", "won", "lost", "abandoned"]),
}, async ({ id, status }) => handle(() => ghl.updateOpportunityStatus(id, status)));

server.tool("ghl_upsert_opportunity", "Create or update an opportunity", {
  data: z.string().describe("JSON string with opportunity data (pipelineId, name, stageId, contactId, etc.)"),
}, async ({ data }) => handle(() => ghl.upsertOpportunity(JSON.parse(data))));

server.tool("ghl_add_opportunity_followers", "Add followers to an opportunity", {
  id: z.string(),
  data: z.string().describe("JSON string with {followers: [userIds]}"),
}, async ({ id, data }) => handle(() => ghl.addOpportunityFollowers(id, JSON.parse(data))));

server.tool("ghl_remove_opportunity_followers", "Remove followers from an opportunity", {
  id: z.string(),
  data: z.string().describe("JSON string with {followers: [userIds]}"),
}, async ({ id, data }) => handle(() => ghl.removeOpportunityFollowers(id, JSON.parse(data))));

server.tool("ghl_get_pipelines", "Get all pipelines and their stages", {}, async () => handle(() => ghl.getPipelines()));

// ==================== WORKFLOWS & CAMPAIGNS ====================

server.tool("ghl_get_workflows", "List all workflows", {}, async () => handle(() => ghl.getWorkflows()));

server.tool("ghl_get_campaigns", "List all campaigns", {}, async () => handle(() => ghl.getCampaigns()));

// ==================== USERS ====================

server.tool("ghl_get_users", "Get users in the location", {}, async () => handle(() => ghl.getUsers()));

server.tool("ghl_get_user", "Get a user by ID", {
  userId: z.string(),
}, async ({ userId }) => handle(() => ghl.getUser(userId)));

server.tool("ghl_create_user", "Create a new user", {
  data: z.string().describe("JSON string with user data (firstName, lastName, email, phone, role, etc.)"),
}, async ({ data }) => handle(() => ghl.createUser(JSON.parse(data))));

server.tool("ghl_update_user", "Update a user", {
  userId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ userId, data }) => handle(() => ghl.updateUser(userId, JSON.parse(data))));

server.tool("ghl_delete_user", "Delete a user", {
  userId: z.string(),
}, async ({ userId }) => handle(() => ghl.deleteUser(userId)));

server.tool("ghl_search_users", "Search users in the location", {
  query: z.string().optional(),
}, async (params) => handle(() => ghl.searchUsers(params)));

// ==================== BUSINESSES ====================

server.tool("ghl_get_businesses", "Get businesses in the location", {}, async () => handle(() => ghl.getBusinesses()));

server.tool("ghl_get_business", "Get a business by ID", {
  businessId: z.string(),
}, async ({ businessId }) => handle(() => ghl.getBusiness(businessId)));

server.tool("ghl_create_business", "Create a new business", {
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
}, async (params) => handle(() => ghl.createBusiness(params)));

server.tool("ghl_update_business", "Update a business", {
  businessId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ businessId, data }) => handle(() => ghl.updateBusiness(businessId, JSON.parse(data))));

server.tool("ghl_delete_business", "Delete a business", {
  businessId: z.string(),
}, async ({ businessId }) => handle(() => ghl.deleteBusiness(businessId)));

// ==================== INVOICES ====================

server.tool("ghl_list_invoices", "List invoices", {
  status: z.string().optional().describe("draft, sent, paid, void, partially_paid"),
  contactId: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listInvoices(params)));

server.tool("ghl_get_invoice", "Get an invoice by ID", {
  invoiceId: z.string(),
}, async ({ invoiceId }) => handle(() => ghl.getInvoice(invoiceId)));

server.tool("ghl_create_invoice", "Create a new invoice", {
  data: z.string().describe("JSON string with invoice data (name, contactId, items, dueDate, etc.)"),
}, async ({ data }) => handle(() => ghl.createInvoice(JSON.parse(data))));

server.tool("ghl_update_invoice", "Update an invoice", {
  invoiceId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ invoiceId, data }) => handle(() => ghl.updateInvoice(invoiceId, JSON.parse(data))));

server.tool("ghl_delete_invoice", "Delete an invoice", {
  invoiceId: z.string(),
}, async ({ invoiceId }) => handle(() => ghl.deleteInvoice(invoiceId)));

server.tool("ghl_send_invoice", "Send an invoice to the contact", {
  invoiceId: z.string(),
  data: z.string().optional().describe("JSON string with optional send options"),
}, async ({ invoiceId, data }) => handle(() => ghl.sendInvoice(invoiceId, data ? JSON.parse(data) : {})));

server.tool("ghl_void_invoice", "Void an invoice", {
  invoiceId: z.string(),
}, async ({ invoiceId }) => handle(() => ghl.voidInvoice(invoiceId)));

server.tool("ghl_record_invoice_payment", "Record a payment on an invoice", {
  invoiceId: z.string(),
  data: z.string().describe("JSON string with payment data (amount, mode, notes, etc.)"),
}, async ({ invoiceId, data }) => handle(() => ghl.recordInvoicePayment(invoiceId, JSON.parse(data))));

server.tool("ghl_generate_invoice_number", "Generate the next invoice number", {}, async () => handle(() => ghl.generateInvoiceNumber()));

server.tool("ghl_send_text2pay", "Send a text-to-pay invoice link", {
  data: z.string().describe("JSON string with text2pay data (contactId, amount, etc.)"),
}, async ({ data }) => handle(() => ghl.sendText2Pay(JSON.parse(data))));

// Invoice Schedules
server.tool("ghl_list_invoice_schedules", "List invoice schedules", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listInvoiceSchedules(params)));

server.tool("ghl_get_invoice_schedule", "Get an invoice schedule by ID", {
  scheduleId: z.string(),
}, async ({ scheduleId }) => handle(() => ghl.getInvoiceSchedule(scheduleId)));

server.tool("ghl_create_invoice_schedule", "Create an invoice schedule", {
  data: z.string().describe("JSON string with schedule data"),
}, async ({ data }) => handle(() => ghl.createInvoiceSchedule(JSON.parse(data))));

server.tool("ghl_update_invoice_schedule", "Update an invoice schedule", {
  scheduleId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ scheduleId, data }) => handle(() => ghl.updateInvoiceSchedule(scheduleId, JSON.parse(data))));

server.tool("ghl_delete_invoice_schedule", "Delete an invoice schedule", {
  scheduleId: z.string(),
}, async ({ scheduleId }) => handle(() => ghl.deleteInvoiceSchedule(scheduleId)));

server.tool("ghl_cancel_invoice_schedule", "Cancel an invoice schedule", {
  scheduleId: z.string(),
}, async ({ scheduleId }) => handle(() => ghl.cancelInvoiceSchedule(scheduleId)));

// Invoice Templates
server.tool("ghl_list_invoice_templates", "List invoice templates", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listInvoiceTemplates(params)));

server.tool("ghl_get_invoice_template", "Get an invoice template by ID", {
  templateId: z.string(),
}, async ({ templateId }) => handle(() => ghl.getInvoiceTemplate(templateId)));

server.tool("ghl_create_invoice_template", "Create an invoice template", {
  data: z.string().describe("JSON string with template data"),
}, async ({ data }) => handle(() => ghl.createInvoiceTemplate(JSON.parse(data))));

server.tool("ghl_update_invoice_template", "Update an invoice template", {
  templateId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ templateId, data }) => handle(() => ghl.updateInvoiceTemplate(templateId, JSON.parse(data))));

server.tool("ghl_delete_invoice_template", "Delete an invoice template", {
  templateId: z.string(),
}, async ({ templateId }) => handle(() => ghl.deleteInvoiceTemplate(templateId)));

// Estimates
server.tool("ghl_list_estimates", "List estimates", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listEstimates(params)));

server.tool("ghl_create_estimate", "Create an estimate", {
  data: z.string().describe("JSON string with estimate data"),
}, async ({ data }) => handle(() => ghl.createEstimate(JSON.parse(data))));

server.tool("ghl_update_estimate", "Update an estimate", {
  estimateId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ estimateId, data }) => handle(() => ghl.updateEstimate(estimateId, JSON.parse(data))));

server.tool("ghl_delete_estimate", "Delete an estimate", {
  estimateId: z.string(),
}, async ({ estimateId }) => handle(() => ghl.deleteEstimate(estimateId)));

server.tool("ghl_send_estimate", "Send an estimate to the contact", {
  estimateId: z.string(),
  data: z.string().optional().describe("JSON string with optional send options"),
}, async ({ estimateId, data }) => handle(() => ghl.sendEstimate(estimateId, data ? JSON.parse(data) : {})));

server.tool("ghl_create_invoice_from_estimate", "Convert an estimate into an invoice", {
  estimateId: z.string(),
}, async ({ estimateId }) => handle(() => ghl.createInvoiceFromEstimate(estimateId)));

// Estimate Templates
server.tool("ghl_list_estimate_templates", "List estimate templates", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listEstimateTemplates(params)));

server.tool("ghl_create_estimate_template", "Create an estimate template", {
  data: z.string().describe("JSON string with estimate template data"),
}, async ({ data }) => handle(() => ghl.createEstimateTemplate(JSON.parse(data))));

server.tool("ghl_update_estimate_template", "Update an estimate template", {
  templateId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ templateId, data }) => handle(() => ghl.updateEstimateTemplate(templateId, JSON.parse(data))));

server.tool("ghl_delete_estimate_template", "Delete an estimate template", {
  templateId: z.string(),
}, async ({ templateId }) => handle(() => ghl.deleteEstimateTemplate(templateId)));

// ==================== PAYMENTS ====================

server.tool("ghl_list_orders", "List payment orders", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listOrders(params)));

server.tool("ghl_get_order", "Get order by ID", {
  orderId: z.string(),
}, async ({ orderId }) => handle(() => ghl.getOrder(orderId)));

server.tool("ghl_list_order_fulfillments", "List fulfillments for an order", {
  orderId: z.string(),
}, async ({ orderId }) => handle(() => ghl.listOrderFulfillments(orderId)));

server.tool("ghl_create_order_fulfillment", "Create a fulfillment for an order", {
  orderId: z.string(),
  data: z.string().describe("JSON string with fulfillment data (trackingNumber, carrier, items, etc.)"),
}, async ({ orderId, data }) => handle(() => ghl.createOrderFulfillment(orderId, JSON.parse(data))));

server.tool("ghl_list_order_notes", "List notes for an order", {
  orderId: z.string(),
}, async ({ orderId }) => handle(() => ghl.listOrderNotes(orderId)));

server.tool("ghl_record_order_payment", "Record a payment on an order", {
  orderId: z.string(),
  data: z.string().describe("JSON string with payment data"),
}, async ({ orderId, data }) => handle(() => ghl.recordOrderPayment(orderId, JSON.parse(data))));

server.tool("ghl_list_transactions", "List payment transactions", {
  limit: z.number().optional(),
  offset: z.number().optional(),
  contactId: z.string().optional(),
}, async (params) => handle(() => ghl.listTransactions(params)));

server.tool("ghl_get_transaction", "Get a transaction by ID", {
  transactionId: z.string(),
}, async ({ transactionId }) => handle(() => ghl.getTransaction(transactionId)));

server.tool("ghl_list_subscriptions", "List subscriptions", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listSubscriptions(params)));

server.tool("ghl_get_subscription", "Get a subscription by ID", {
  subscriptionId: z.string(),
}, async ({ subscriptionId }) => handle(() => ghl.getSubscription(subscriptionId)));

// Coupons
server.tool("ghl_list_coupons", "List payment coupons", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listCoupons(params)));

server.tool("ghl_get_coupon", "Get a coupon", {
  couponId: z.string().optional().describe("Coupon ID"),
}, async (params) => handle(() => ghl.getCoupon(params)));

server.tool("ghl_create_coupon", "Create a coupon", {
  data: z.string().describe("JSON string with coupon data (name, code, discountType, discountAmount, etc.)"),
}, async ({ data }) => handle(() => ghl.createCoupon(JSON.parse(data))));

server.tool("ghl_update_coupon", "Update a coupon", {
  data: z.string().describe("JSON string with coupon data including couponId"),
}, async ({ data }) => handle(() => ghl.updateCoupon(JSON.parse(data))));

server.tool("ghl_delete_coupon", "Delete a coupon", {
  couponId: z.string(),
}, async ({ couponId }) => handle(() => ghl.deleteCoupon({ couponId })));

// Custom Payment Providers
server.tool("ghl_get_custom_payment_provider", "Get custom payment provider config", {}, async () => handle(() => ghl.getCustomPaymentProvider()));

server.tool("ghl_create_custom_payment_provider", "Connect a custom payment provider", {
  data: z.string().describe("JSON string with provider config"),
}, async ({ data }) => handle(() => ghl.createCustomPaymentProvider(JSON.parse(data))));

server.tool("ghl_disconnect_custom_payment_provider", "Disconnect a custom payment provider", {
  data: z.string().describe("JSON string with disconnect data"),
}, async ({ data }) => handle(() => ghl.disconnectCustomPaymentProvider(JSON.parse(data))));

// Payment Integrations
server.tool("ghl_list_whitelabel_providers", "List whitelabel payment integration providers", {}, async () => handle(() => ghl.listWhitelabelProviders()));

// ==================== FORMS & SURVEYS ====================

server.tool("ghl_get_forms", "List all forms", {}, async () => handle(() => ghl.getForms()));

server.tool("ghl_get_form_submissions", "Get form submissions", {
  formId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
}, async (params) => handle(() => ghl.getFormSubmissions(params)));

server.tool("ghl_get_surveys", "List all surveys", {}, async () => handle(() => ghl.getSurveys()));

server.tool("ghl_get_survey_submissions", "Get survey submissions", {
  surveyId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
}, async (params) => handle(() => ghl.getSurveySubmissions(params)));

// ==================== PRODUCTS ====================

server.tool("ghl_list_products", "List products", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listProducts(params)));

server.tool("ghl_get_product", "Get a product by ID", {
  productId: z.string(),
}, async ({ productId }) => handle(() => ghl.getProduct(productId)));

server.tool("ghl_create_product", "Create a product", {
  name: z.string(),
  description: z.string().optional(),
  productType: z.string().optional().describe("PHYSICAL or DIGITAL"),
  data: z.string().optional().describe("JSON string of additional product data"),
}, async ({ data, ...params }) => {
  const body = { ...params };
  if (data) Object.assign(body, JSON.parse(data));
  return handle(() => ghl.createProduct(body));
});

server.tool("ghl_update_product", "Update a product", {
  productId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ productId, data }) => handle(() => ghl.updateProduct(productId, JSON.parse(data))));

server.tool("ghl_delete_product", "Delete a product", {
  productId: z.string(),
}, async ({ productId }) => handle(() => ghl.deleteProduct(productId)));

// Product Prices
server.tool("ghl_list_product_prices", "List prices for a product", {
  productId: z.string(),
}, async ({ productId }) => handle(() => ghl.listProductPrices(productId)));

server.tool("ghl_get_product_price", "Get a specific product price", {
  productId: z.string(),
  priceId: z.string(),
}, async ({ productId, priceId }) => handle(() => ghl.getProductPrice(productId, priceId)));

server.tool("ghl_create_product_price", "Create a price for a product", {
  productId: z.string(),
  data: z.string().describe("JSON string with price data (name, amount, currency, type, etc.)"),
}, async ({ productId, data }) => handle(() => ghl.createProductPrice(productId, JSON.parse(data))));

server.tool("ghl_update_product_price", "Update a product price", {
  productId: z.string(),
  priceId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ productId, priceId, data }) => handle(() => ghl.updateProductPrice(productId, priceId, JSON.parse(data))));

server.tool("ghl_delete_product_price", "Delete a product price", {
  productId: z.string(),
  priceId: z.string(),
}, async ({ productId, priceId }) => handle(() => ghl.deleteProductPrice(productId, priceId)));

// Product Collections
server.tool("ghl_list_product_collections", "List product collections", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listProductCollections(params)));

server.tool("ghl_get_product_collection", "Get a product collection by ID", {
  collectionId: z.string(),
}, async ({ collectionId }) => handle(() => ghl.getProductCollection(collectionId)));

server.tool("ghl_create_product_collection", "Create a product collection", {
  data: z.string().describe("JSON string with collection data (name, description, etc.)"),
}, async ({ data }) => handle(() => ghl.createProductCollection(JSON.parse(data))));

server.tool("ghl_update_product_collection", "Update a product collection", {
  collectionId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ collectionId, data }) => handle(() => ghl.updateProductCollection(collectionId, JSON.parse(data))));

server.tool("ghl_delete_product_collection", "Delete a product collection", {
  collectionId: z.string(),
}, async ({ collectionId }) => handle(() => ghl.deleteProductCollection(collectionId)));

// Product Inventory & Reviews
server.tool("ghl_list_inventory", "List product inventory", {
  productId: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listInventory(params)));

server.tool("ghl_update_inventory", "Update product inventory", {
  data: z.string().describe("JSON string with inventory update data"),
}, async ({ data }) => handle(() => ghl.updateInventory(JSON.parse(data))));

server.tool("ghl_list_product_reviews", "List product reviews", {
  productId: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listProductReviews(params)));

server.tool("ghl_update_product_review", "Update a product review", {
  reviewId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ reviewId, data }) => handle(() => ghl.updateProductReview(reviewId, JSON.parse(data))));

server.tool("ghl_delete_product_review", "Delete a product review", {
  reviewId: z.string(),
}, async ({ reviewId }) => handle(() => ghl.deleteProductReview(reviewId)));

// ==================== FUNNELS ====================

server.tool("ghl_list_funnels", "List all funnels", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listFunnels(params)));

server.tool("ghl_list_funnel_pages", "List funnel pages", {
  funnelId: z.string(),
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listFunnelPages(params)));

server.tool("ghl_get_funnel_page_count", "Get funnel page count", {
  funnelId: z.string().optional(),
}, async (params) => handle(() => ghl.getFunnelPageCount(params)));

// Funnel Redirects
server.tool("ghl_list_funnel_redirects", "List funnel redirects", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listFunnelRedirects(params)));

server.tool("ghl_create_funnel_redirect", "Create a funnel redirect", {
  data: z.string().describe("JSON string with redirect data (source, target, type, etc.)"),
}, async ({ data }) => handle(() => ghl.createFunnelRedirect(JSON.parse(data))));

server.tool("ghl_update_funnel_redirect", "Update a funnel redirect", {
  redirectId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ redirectId, data }) => handle(() => ghl.updateFunnelRedirect(redirectId, JSON.parse(data))));

server.tool("ghl_delete_funnel_redirect", "Delete a funnel redirect", {
  redirectId: z.string(),
}, async ({ redirectId }) => handle(() => ghl.deleteFunnelRedirect(redirectId)));

// ==================== BLOGS ====================

server.tool("ghl_get_blog_sites", "Get all blog sites", {}, async () => handle(() => ghl.getBlogSites()));

server.tool("ghl_get_blogs_list", "Get list of blogs", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.getBlogsList(params)));

server.tool("ghl_get_blog_posts", "Get blog posts", {
  blogId: z.string().optional().describe("Blog site ID"),
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.getBlogPosts(params)));

server.tool("ghl_create_blog_post", "Create a blog post", {
  blogId: z.string(),
  title: z.string(),
  content: z.string().optional().describe("HTML content"),
  status: z.string().optional().describe("draft, published"),
  data: z.string().optional().describe("JSON string of additional fields"),
}, async ({ data, ...params }) => {
  const body = { ...params };
  if (data) Object.assign(body, JSON.parse(data));
  return handle(() => ghl.createBlogPost(body));
});

server.tool("ghl_update_blog_post", "Update a blog post", {
  postId: z.string(),
  data: z.string().describe("JSON string of fields to update (title, content, status, etc.)"),
}, async ({ postId, data }) => handle(() => ghl.updateBlogPost(postId, JSON.parse(data))));

server.tool("ghl_check_blog_slug", "Check if a blog post URL slug exists", {
  slug: z.string().describe("URL slug to check"),
  blogId: z.string().optional(),
}, async (params) => handle(() => ghl.checkBlogSlug(params)));

server.tool("ghl_get_blog_authors", "Get blog authors", {}, async () => handle(() => ghl.getBlogAuthors()));

server.tool("ghl_get_blog_categories", "Get blog categories", {}, async () => handle(() => ghl.getBlogCategories()));

// ==================== SOCIAL MEDIA PLANNER ====================

server.tool("ghl_get_social_accounts", "Get connected social media accounts", {}, async () => handle(() => ghl.getSocialAccounts()));

server.tool("ghl_delete_social_account", "Delete a connected social media account", {
  accountId: z.string(),
}, async ({ accountId }) => handle(() => ghl.deleteSocialAccount(accountId)));

server.tool("ghl_get_social_posts", "Get social media posts", {
  type: z.string().optional().describe("scheduled, published, failed, in_review, draft"),
  limit: z.number().optional(),
  skip: z.number().optional(),
}, async (params) => handle(() => ghl.getSocialPosts(params)));

server.tool("ghl_create_social_post", "Create a social media post", {
  accountIds: z.array(z.string()).describe("Social account IDs to post to"),
  post: z.string().describe("Post content text"),
  scheduleDate: z.string().optional().describe("ISO date for scheduled posting"),
  data: z.string().optional().describe("JSON string of additional options (media, etc.)"),
}, async ({ data, ...params }) => {
  const body = { ...params };
  if (data) Object.assign(body, JSON.parse(data));
  return handle(() => ghl.createSocialPost(body));
});

server.tool("ghl_get_social_post", "Get a social media post by ID", {
  postId: z.string(),
}, async ({ postId }) => handle(() => ghl.getSocialPost(postId)));

server.tool("ghl_update_social_post", "Update a social media post", {
  postId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ postId, data }) => handle(() => ghl.updateSocialPost(postId, JSON.parse(data))));

server.tool("ghl_delete_social_post", "Delete a social media post", {
  postId: z.string(),
}, async ({ postId }) => handle(() => ghl.deleteSocialPost(postId)));

server.tool("ghl_bulk_delete_social_posts", "Bulk delete social media posts", {
  data: z.string().describe("JSON string with {postIds: [...]}"),
}, async ({ data }) => handle(() => ghl.bulkDeleteSocialPosts(JSON.parse(data))));

server.tool("ghl_get_social_categories", "Get social media post categories", {}, async () => handle(() => ghl.getSocialCategories()));

server.tool("ghl_get_social_tags", "Get social media tags", {}, async () => handle(() => ghl.getSocialTags()));

server.tool("ghl_get_social_statistics", "Get social media statistics", {
  data: z.string().describe("JSON string with statistics query params (startDate, endDate, accountIds, etc.)"),
}, async ({ data }) => handle(() => ghl.getSocialStatistics(JSON.parse(data))));

// ==================== LOCATIONS / SUB-ACCOUNTS ====================

server.tool("ghl_get_location", "Get location/sub-account details", {
  locationId: z.string().optional().describe("Location ID (defaults to current)"),
}, async ({ locationId }) => handle(() => ghl.getLocation(locationId)));

server.tool("ghl_update_location", "Update location settings", {
  data: z.string().describe("JSON string of fields to update"),
}, async ({ data }) => handle(() => ghl.updateLocation(JSON.parse(data))));

server.tool("ghl_search_locations", "Search locations/sub-accounts", {
  query: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.searchLocations(params)));

server.tool("ghl_get_tags", "Get all tags in the location", {}, async () => handle(() => ghl.getLocationTags()));

server.tool("ghl_get_tag_by_id", "Get a tag by ID", {
  tagId: z.string(),
}, async ({ tagId }) => handle(() => ghl.getTagById(tagId)));

server.tool("ghl_create_tag", "Create a new tag", {
  name: z.string(),
}, async ({ name }) => handle(() => ghl.createTag({ name })));

server.tool("ghl_update_tag", "Update a tag", {
  tagId: z.string(),
  data: z.string().describe("JSON string of fields to update (name, etc.)"),
}, async ({ tagId, data }) => handle(() => ghl.updateTag(tagId, JSON.parse(data))));

server.tool("ghl_delete_tag", "Delete a tag", {
  tagId: z.string(),
}, async ({ tagId }) => handle(() => ghl.deleteTag(tagId)));

server.tool("ghl_get_custom_fields", "Get location custom fields", {}, async () => handle(() => ghl.getLocationCustomFields()));

server.tool("ghl_create_location_custom_field", "Create a location custom field", {
  data: z.string().describe("JSON string with custom field data (name, dataType, placeholder, etc.)"),
}, async ({ data }) => handle(() => ghl.createLocationCustomField(JSON.parse(data))));

server.tool("ghl_update_location_custom_field", "Update a location custom field", {
  fieldId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ fieldId, data }) => handle(() => ghl.updateLocationCustomField(fieldId, JSON.parse(data))));

server.tool("ghl_delete_location_custom_field", "Delete a location custom field", {
  fieldId: z.string(),
}, async ({ fieldId }) => handle(() => ghl.deleteLocationCustomField(fieldId)));

server.tool("ghl_get_custom_values", "Get location custom values", {}, async () => handle(() => ghl.getLocationCustomValues()));

server.tool("ghl_create_location_custom_value", "Create a location custom value", {
  data: z.string().describe("JSON string with custom value data (fieldKey, value)"),
}, async ({ data }) => handle(() => ghl.createLocationCustomValue(JSON.parse(data))));

server.tool("ghl_update_location_custom_value", "Update a location custom value", {
  valueId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ valueId, data }) => handle(() => ghl.updateLocationCustomValue(valueId, JSON.parse(data))));

server.tool("ghl_delete_location_custom_value", "Delete a location custom value", {
  valueId: z.string(),
}, async ({ valueId }) => handle(() => ghl.deleteLocationCustomValue(valueId)));

server.tool("ghl_get_templates", "Get email/SMS templates", {
  type: z.string().optional().describe("email or sms"),
}, async (params) => handle(() => ghl.getLocationTemplates(params)));

server.tool("ghl_delete_location_template", "Delete a location template", {
  templateId: z.string(),
}, async ({ templateId }) => handle(() => ghl.deleteLocationTemplate(templateId)));

server.tool("ghl_get_timezones", "Get location timezones", {}, async () => handle(() => ghl.getLocationTimezones()));

// Location Tasks
server.tool("ghl_search_location_tasks", "Search tasks in the location", {
  data: z.string().describe("JSON string with search filters"),
}, async ({ data }) => handle(() => ghl.searchLocationTasks(JSON.parse(data))));

// Recurring Tasks
server.tool("ghl_create_recurring_task", "Create a recurring task", {
  data: z.string().describe("JSON string with recurring task data"),
}, async ({ data }) => handle(() => ghl.createRecurringTask(JSON.parse(data))));

server.tool("ghl_get_recurring_task", "Get a recurring task by ID", {
  taskId: z.string(),
}, async ({ taskId }) => handle(() => ghl.getRecurringTask(taskId)));

server.tool("ghl_update_recurring_task", "Update a recurring task", {
  taskId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ taskId, data }) => handle(() => ghl.updateRecurringTask(taskId, JSON.parse(data))));

server.tool("ghl_delete_recurring_task", "Delete a recurring task", {
  taskId: z.string(),
}, async ({ taskId }) => handle(() => ghl.deleteRecurringTask(taskId)));

// ==================== TRIGGER LINKS ====================

server.tool("ghl_get_links", "Get trigger links", {}, async () => handle(() => ghl.getLinks()));

server.tool("ghl_get_link_by_id", "Get a trigger link by ID", {
  linkId: z.string(),
}, async ({ linkId }) => handle(() => ghl.getLinkById(linkId)));

server.tool("ghl_search_links", "Search trigger links", {
  query: z.string().optional(),
}, async (params) => handle(() => ghl.searchLinks(params)));

server.tool("ghl_create_link", "Create a trigger link", {
  name: z.string(),
  redirectTo: z.string().describe("URL to redirect to"),
}, async (params) => handle(() => ghl.createLink(params)));

server.tool("ghl_update_link", "Update a trigger link", {
  linkId: z.string(),
  data: z.string().describe("JSON string of fields to update (name, redirectTo, etc.)"),
}, async ({ linkId, data }) => handle(() => ghl.updateLink(linkId, JSON.parse(data))));

server.tool("ghl_delete_link", "Delete a trigger link", {
  linkId: z.string(),
}, async ({ linkId }) => handle(() => ghl.deleteLink(linkId)));

// ==================== EMAILS ====================

server.tool("ghl_get_email_templates", "Get email builder templates", {}, async () => handle(() => ghl.getEmailTemplates()));

server.tool("ghl_create_email_template", "Create an email builder template", {
  data: z.string().describe("JSON string with email template data (name, html, etc.)"),
}, async ({ data }) => handle(() => ghl.createEmailTemplate(JSON.parse(data))));

server.tool("ghl_update_email_template", "Update an email builder template", {
  data: z.string().describe("JSON string with template data to update"),
}, async ({ data }) => handle(() => ghl.updateEmailTemplate(JSON.parse(data))));

server.tool("ghl_delete_email_template", "Delete an email builder template", {
  templateId: z.string(),
}, async ({ templateId }) => handle(() => ghl.deleteEmailTemplate(templateId)));

server.tool("ghl_get_email_schedules", "Get email schedules", {}, async () => handle(() => ghl.getEmailSchedules()));

server.tool("ghl_verify_email", "Verify an email address", {
  email: z.string().describe("Email address to verify"),
}, async ({ email }) => handle(() => ghl.verifyEmail({ email })));

// ==================== MEDIA LIBRARY ====================

server.tool("ghl_get_media_files", "List files in media library", {
  sortBy: z.string().optional(),
  sortOrder: z.string().optional().describe("asc or desc"),
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.getMediaFiles(params)));

server.tool("ghl_upload_media_file", "Upload a file to the media library", {
  data: z.string().describe("JSON string with file data (url, name, etc.)"),
}, async ({ data }) => handle(() => ghl.uploadMediaFile(JSON.parse(data))));

server.tool("ghl_create_media_folder", "Create a folder in the media library", {
  name: z.string().describe("Folder name"),
}, async ({ name }) => handle(() => ghl.createMediaFolder({ name })));

server.tool("ghl_update_media_file", "Update a media file", {
  fileId: z.string(),
  data: z.string().describe("JSON string of fields to update (name, altText, etc.)"),
}, async ({ fileId, data }) => handle(() => ghl.updateMediaFile(fileId, JSON.parse(data))));

server.tool("ghl_delete_media_file", "Delete a media file", {
  fileId: z.string(),
}, async ({ fileId }) => handle(() => ghl.deleteMediaFile(fileId)));

server.tool("ghl_bulk_delete_media", "Bulk delete media files", {
  data: z.string().describe("JSON string with {fileIds: [...]}"),
}, async ({ data }) => handle(() => ghl.bulkDeleteMedia(JSON.parse(data))));

server.tool("ghl_bulk_update_media", "Bulk update media files", {
  data: z.string().describe("JSON string with bulk update data"),
}, async ({ data }) => handle(() => ghl.bulkUpdateMedia(JSON.parse(data))));

// ==================== OBJECTS (Custom Objects) ====================

server.tool("ghl_get_objects", "List custom objects", {}, async () => handle(() => ghl.getObjects()));

server.tool("ghl_get_object_schema", "Get a custom object schema by key", {
  objectKey: z.string().describe("Object key"),
}, async ({ objectKey }) => handle(() => ghl.getObjectSchema(objectKey)));

server.tool("ghl_create_object_schema", "Create a custom object schema", {
  data: z.string().describe("JSON string with object schema data (key, name, fields, etc.)"),
}, async ({ data }) => handle(() => ghl.createObjectSchema(JSON.parse(data))));

server.tool("ghl_update_object_schema", "Update a custom object schema", {
  objectKey: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ objectKey, data }) => handle(() => ghl.updateObjectSchema(objectKey, JSON.parse(data))));

// Object Records
server.tool("ghl_search_object_records", "Search records in a custom object", {
  schemaKey: z.string().describe("Object schema key"),
  data: z.string().describe("JSON string with search filters"),
}, async ({ schemaKey, data }) => handle(() => ghl.searchObjectRecords(schemaKey, JSON.parse(data))));

server.tool("ghl_get_object_record", "Get a record from a custom object", {
  schemaKey: z.string(),
  recordId: z.string(),
}, async ({ schemaKey, recordId }) => handle(() => ghl.getObjectRecord(schemaKey, recordId)));

server.tool("ghl_create_object_record", "Create a record in a custom object", {
  schemaKey: z.string(),
  data: z.string().describe("JSON string with record data"),
}, async ({ schemaKey, data }) => handle(() => ghl.createObjectRecord(schemaKey, JSON.parse(data))));

server.tool("ghl_update_object_record", "Update a record in a custom object", {
  schemaKey: z.string(),
  recordId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ schemaKey, recordId, data }) => handle(() => ghl.updateObjectRecord(schemaKey, recordId, JSON.parse(data))));

server.tool("ghl_delete_object_record", "Delete a record from a custom object", {
  schemaKey: z.string(),
  recordId: z.string(),
}, async ({ schemaKey, recordId }) => handle(() => ghl.deleteObjectRecord(schemaKey, recordId)));

// ==================== ASSOCIATIONS ====================

server.tool("ghl_get_associations", "List associations", {}, async () => handle(() => ghl.getAssociations()));

server.tool("ghl_get_association", "Get an association by ID", {
  associationId: z.string(),
}, async ({ associationId }) => handle(() => ghl.getAssociation(associationId)));

server.tool("ghl_get_association_by_key", "Get an association by key", {
  key: z.string(),
}, async ({ key }) => handle(() => ghl.getAssociationByKey(key)));

server.tool("ghl_get_associations_by_object_key", "Get associations by object key", {
  objectKey: z.string(),
}, async ({ objectKey }) => handle(() => ghl.getAssociationsByObjectKey(objectKey)));

server.tool("ghl_create_association", "Create an association", {
  data: z.string().describe("JSON string with association data"),
}, async ({ data }) => handle(() => ghl.createAssociation(JSON.parse(data))));

server.tool("ghl_update_association", "Update an association", {
  associationId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ associationId, data }) => handle(() => ghl.updateAssociation(associationId, JSON.parse(data))));

server.tool("ghl_delete_association", "Delete an association", {
  associationId: z.string(),
}, async ({ associationId }) => handle(() => ghl.deleteAssociation(associationId)));

// Association Relations
server.tool("ghl_get_relations", "Get relations for a record", {
  recordId: z.string(),
}, async ({ recordId }) => handle(() => ghl.getRelations(recordId)));

server.tool("ghl_create_relation", "Create a relation between records", {
  data: z.string().describe("JSON string with relation data (associationId, recordId1, recordId2, etc.)"),
}, async ({ data }) => handle(() => ghl.createRelation(JSON.parse(data))));

server.tool("ghl_delete_relation", "Delete a relation", {
  relationId: z.string(),
}, async ({ relationId }) => handle(() => ghl.deleteRelation(relationId)));

// ==================== CUSTOM FIELDS V2 ====================

server.tool("ghl_get_custom_fields_by_object_key", "Get custom fields by object key (V2)", {
  objectKey: z.string().describe("Object key (e.g. contact, opportunity)"),
}, async ({ objectKey }) => handle(() => ghl.getCustomFieldsByObjectKey(objectKey)));

server.tool("ghl_get_custom_field_by_id", "Get a custom field by ID (V2)", {
  fieldId: z.string(),
}, async ({ fieldId }) => handle(() => ghl.getCustomFieldById(fieldId)));

server.tool("ghl_create_custom_field", "Create a custom field (V2)", {
  data: z.string().describe("JSON string with field data (name, dataType, objectKey, etc.)"),
}, async ({ data }) => handle(() => ghl.createCustomField(JSON.parse(data))));

server.tool("ghl_update_custom_field", "Update a custom field (V2)", {
  fieldId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ fieldId, data }) => handle(() => ghl.updateCustomField(fieldId, JSON.parse(data))));

server.tool("ghl_delete_custom_field", "Delete a custom field (V2)", {
  fieldId: z.string(),
}, async ({ fieldId }) => handle(() => ghl.deleteCustomField(fieldId)));

server.tool("ghl_create_custom_field_folder", "Create a custom field folder (V2)", {
  data: z.string().describe("JSON string with folder data (name, objectKey)"),
}, async ({ data }) => handle(() => ghl.createCustomFieldFolder(JSON.parse(data))));

server.tool("ghl_update_custom_field_folder", "Update a custom field folder (V2)", {
  folderId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ folderId, data }) => handle(() => ghl.updateCustomFieldFolder(folderId, JSON.parse(data))));

server.tool("ghl_delete_custom_field_folder", "Delete a custom field folder (V2)", {
  folderId: z.string(),
}, async ({ folderId }) => handle(() => ghl.deleteCustomFieldFolder(folderId)));

// ==================== COURSES ====================

server.tool("ghl_import_courses", "Import courses", {
  data: z.string().describe("JSON string with course import data"),
}, async ({ data }) => handle(() => ghl.importCourses(JSON.parse(data))));

// ==================== STORE ====================

server.tool("ghl_get_store_settings", "Get store settings", {}, async () => handle(() => ghl.getStoreSettings()));

server.tool("ghl_update_store_settings", "Update store settings", {
  data: z.string().describe("JSON string with store settings data"),
}, async ({ data }) => handle(() => ghl.updateStoreSettings(JSON.parse(data))));

// Shipping Carriers
server.tool("ghl_list_shipping_carriers", "List shipping carriers", {}, async () => handle(() => ghl.listShippingCarriers()));

server.tool("ghl_get_shipping_carrier", "Get a shipping carrier by ID", {
  carrierId: z.string(),
}, async ({ carrierId }) => handle(() => ghl.getShippingCarrier(carrierId)));

server.tool("ghl_create_shipping_carrier", "Create a shipping carrier", {
  data: z.string().describe("JSON string with carrier data (name, type, rates, etc.)"),
}, async ({ data }) => handle(() => ghl.createShippingCarrier(JSON.parse(data))));

server.tool("ghl_update_shipping_carrier", "Update a shipping carrier", {
  carrierId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ carrierId, data }) => handle(() => ghl.updateShippingCarrier(carrierId, JSON.parse(data))));

server.tool("ghl_delete_shipping_carrier", "Delete a shipping carrier", {
  carrierId: z.string(),
}, async ({ carrierId }) => handle(() => ghl.deleteShippingCarrier(carrierId)));

// Shipping Zones
server.tool("ghl_list_shipping_zones", "List shipping zones", {}, async () => handle(() => ghl.listShippingZones()));

server.tool("ghl_get_shipping_zone", "Get a shipping zone by ID", {
  zoneId: z.string(),
}, async ({ zoneId }) => handle(() => ghl.getShippingZone(zoneId)));

server.tool("ghl_create_shipping_zone", "Create a shipping zone", {
  data: z.string().describe("JSON string with zone data"),
}, async ({ data }) => handle(() => ghl.createShippingZone(JSON.parse(data))));

server.tool("ghl_update_shipping_zone", "Update a shipping zone", {
  zoneId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ zoneId, data }) => handle(() => ghl.updateShippingZone(zoneId, JSON.parse(data))));

server.tool("ghl_delete_shipping_zone", "Delete a shipping zone", {
  zoneId: z.string(),
}, async ({ zoneId }) => handle(() => ghl.deleteShippingZone(zoneId)));

// ==================== SAAS ====================

server.tool("ghl_get_saas_subscription", "Get SaaS subscription for the location", {}, async () => handle(() => ghl.getSaasSubscription()));

server.tool("ghl_update_saas_subscription", "Update SaaS subscription", {
  data: z.string().describe("JSON string with subscription update data"),
}, async ({ data }) => handle(() => ghl.updateSaasSubscription(JSON.parse(data))));

server.tool("ghl_enable_saas", "Enable SaaS for the location", {
  data: z.string().describe("JSON string with SaaS enablement data"),
}, async ({ data }) => handle(() => ghl.enableSaas(JSON.parse(data))));

// ==================== SNAPSHOTS ====================

server.tool("ghl_get_snapshots", "List snapshots", {
  companyId: z.string().optional(),
}, async (params) => handle(() => ghl.getSnapshots(params)));

server.tool("ghl_create_snapshot_share_link", "Create a snapshot share link", {
  data: z.string().describe("JSON string with {snapshotId, companyId, etc.}"),
}, async ({ data }) => handle(() => ghl.createSnapshotShareLink(JSON.parse(data))));

server.tool("ghl_get_snapshot_status", "Get snapshot push/pull status", {
  snapshotId: z.string(),
  companyId: z.string().optional(),
}, async ({ snapshotId, ...query }) => handle(() => ghl.getSnapshotStatus(snapshotId, query)));

// ==================== VOICE AI ====================

server.tool("ghl_list_voice_agents", "List voice AI agents", {}, async () => handle(() => ghl.listVoiceAgents()));

server.tool("ghl_get_voice_agent", "Get a voice AI agent by ID", {
  agentId: z.string(),
}, async ({ agentId }) => handle(() => ghl.getVoiceAgent(agentId)));

server.tool("ghl_create_voice_agent", "Create a voice AI agent", {
  data: z.string().describe("JSON string with voice agent data (name, prompt, voice, etc.)"),
}, async ({ data }) => handle(() => ghl.createVoiceAgent(JSON.parse(data))));

server.tool("ghl_update_voice_agent", "Update a voice AI agent", {
  agentId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ agentId, data }) => handle(() => ghl.updateVoiceAgent(agentId, JSON.parse(data))));

server.tool("ghl_delete_voice_agent", "Delete a voice AI agent", {
  agentId: z.string(),
}, async ({ agentId }) => handle(() => ghl.deleteVoiceAgent(agentId)));

server.tool("ghl_get_voice_agent_action", "Get a voice AI agent action by ID", {
  actionId: z.string(),
}, async ({ actionId }) => handle(() => ghl.getVoiceAgentAction(actionId)));

server.tool("ghl_create_voice_agent_action", "Create a voice AI agent action", {
  data: z.string().describe("JSON string with action data"),
}, async ({ data }) => handle(() => ghl.createVoiceAgentAction(JSON.parse(data))));

server.tool("ghl_update_voice_agent_action", "Update a voice AI agent action", {
  actionId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ actionId, data }) => handle(() => ghl.updateVoiceAgentAction(actionId, JSON.parse(data))));

server.tool("ghl_delete_voice_agent_action", "Delete a voice AI agent action", {
  actionId: z.string(),
}, async ({ actionId }) => handle(() => ghl.deleteVoiceAgentAction(actionId)));

server.tool("ghl_list_voice_call_logs", "List voice AI call logs", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listVoiceCallLogs(params)));

server.tool("ghl_get_voice_call_log", "Get a voice AI call log by ID", {
  logId: z.string(),
}, async ({ logId }) => handle(() => ghl.getVoiceCallLog(logId)));

// ==================== DOCUMENTS & CONTRACTS ====================

server.tool("ghl_list_documents", "List documents/proposals", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listDocuments(params)));

server.tool("ghl_send_document", "Send a document/proposal", {
  data: z.string().describe("JSON string with send data (documentId, contactId, etc.)"),
}, async ({ data }) => handle(() => ghl.sendDocument(JSON.parse(data))));

server.tool("ghl_list_document_templates", "List document/proposal templates", {
  limit: z.number().optional(),
  offset: z.number().optional(),
}, async (params) => handle(() => ghl.listDocumentTemplates(params)));

server.tool("ghl_send_document_template", "Send a document template to a contact", {
  data: z.string().describe("JSON string with send data (templateId, contactId, etc.)"),
}, async ({ data }) => handle(() => ghl.sendDocumentTemplate(JSON.parse(data))));

// ==================== PHONE SYSTEM ====================

server.tool("ghl_list_phone_numbers", "List phone numbers for the location", {}, async () => handle(() => ghl.listPhoneNumbers()));

server.tool("ghl_list_number_pools", "List phone number pools", {}, async () => handle(() => ghl.listNumberPools()));

// ==================== COMPANIES ====================

server.tool("ghl_get_company", "Get a company by ID", {
  companyId: z.string(),
}, async ({ companyId }) => handle(() => ghl.getCompany(companyId)));

// ==================== CUSTOM MENUS ====================

server.tool("ghl_get_custom_menus", "List custom menus", {}, async () => handle(() => ghl.getCustomMenus()));

server.tool("ghl_get_custom_menu", "Get a custom menu by ID", {
  menuId: z.string(),
}, async ({ menuId }) => handle(() => ghl.getCustomMenu(menuId)));

server.tool("ghl_create_custom_menu", "Create a custom menu", {
  data: z.string().describe("JSON string with menu data (name, links, etc.)"),
}, async ({ data }) => handle(() => ghl.createCustomMenu(JSON.parse(data))));

server.tool("ghl_update_custom_menu", "Update a custom menu", {
  menuId: z.string(),
  data: z.string().describe("JSON string of fields to update"),
}, async ({ menuId, data }) => handle(() => ghl.updateCustomMenu(menuId, JSON.parse(data))));

server.tool("ghl_delete_custom_menu", "Delete a custom menu", {
  menuId: z.string(),
}, async ({ menuId }) => handle(() => ghl.deleteCustomMenu(menuId)));

// ==================== START SERVER ====================

const transport = new StdioServerTransport();
await server.connect(transport);
