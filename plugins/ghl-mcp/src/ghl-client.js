const BASE_URL = "https://services.leadconnectorhq.com";

export class GHLClient {
  constructor(apiKey, locationId) {
    this.apiKey = apiKey;
    this.locationId = locationId;
  }

  async request(method, path, { body, query } = {}) {
    const url = new URL(path, BASE_URL);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
      }
    }
    const headers = { Authorization: `Bearer ${this.apiKey}`, Version: "2021-07-28", Accept: "application/json" };
    const opts = { method, headers };
    if (body) { headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    const res = await fetch(url.toString(), opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) { throw new Error(`GHL API ${res.status}: ${typeof data === "object" ? JSON.stringify(data, null, 2) : data}`); }
    return data;
  }

  _loc(extra = {}) { return { locationId: this.locationId, ...extra }; }
  _locQ(extra = {}) { return { query: this._loc(extra) }; }

  // ==================== CONTACTS ====================
  getContacts(q = {}) { return this.request("GET", "/contacts/", { query: this._loc(q) }); }
  getContact(id) { return this.request("GET", `/contacts/${id}`); }
  createContact(d) { return this.request("POST", "/contacts/", { body: this._loc(d) }); }
  updateContact(id, d) { return this.request("PUT", `/contacts/${id}`, { body: d }); }
  deleteContact(id) { return this.request("DELETE", `/contacts/${id}`); }
  searchContacts(d) { return this.request("POST", "/contacts/search", { body: this._loc(d) }); }
  upsertContact(d) { return this.request("POST", "/contacts/upsert", { body: this._loc(d) }); }
  getDuplicateContact(q) { return this.request("GET", "/contacts/search/duplicate", { query: this._loc(q) }); }
  bulkUpdateContactTags(type, d) { return this.request("POST", `/contacts/bulk/tags/update/${type}`, { body: d }); }
  addContactTags(id, tags) { return this.request("POST", `/contacts/${id}/tags`, { body: { tags } }); }
  removeContactTags(id, tags) { return this.request("DELETE", `/contacts/${id}/tags`, { body: { tags } }); }
  addContactToWorkflow(cId, wId) { return this.request("POST", `/contacts/${cId}/workflow/${wId}`); }
  removeContactFromWorkflow(cId, wId) { return this.request("DELETE", `/contacts/${cId}/workflow/${wId}`); }
  addContactToCampaign(cId, campId) { return this.request("POST", `/contacts/${cId}/campaigns/${campId}`); }
  removeContactFromCampaign(cId, campId) { return this.request("DELETE", `/contacts/${cId}/campaigns/${campId}`); }
  removeContactFromAllCampaigns(cId) { return this.request("DELETE", `/contacts/${cId}/campaigns/removeAll`); }
  addContactFollowers(cId, d) { return this.request("POST", `/contacts/${cId}/followers`, { body: d }); }
  removeContactFollowers(cId, d) { return this.request("DELETE", `/contacts/${cId}/followers`, { body: d }); }
  getContactAppointments(id) { return this.request("GET", `/contacts/${id}/appointments`); }
  getContactNotes(id) { return this.request("GET", `/contacts/${id}/notes`); }
  createContactNote(id, d) { return this.request("POST", `/contacts/${id}/notes`, { body: d }); }
  updateContactNote(cId, nId, d) { return this.request("PUT", `/contacts/${cId}/notes/${nId}`, { body: d }); }
  deleteContactNote(cId, nId) { return this.request("DELETE", `/contacts/${cId}/notes/${nId}`); }
  getContactTasks(id) { return this.request("GET", `/contacts/${id}/tasks`); }
  createContactTask(id, d) { return this.request("POST", `/contacts/${id}/tasks`, { body: d }); }
  updateContactTask(cId, tId, d) { return this.request("PUT", `/contacts/${cId}/tasks/${tId}`, { body: d }); }
  deleteContactTask(cId, tId) { return this.request("DELETE", `/contacts/${cId}/tasks/${tId}`); }
  completeContactTask(cId, tId, d) { return this.request("PUT", `/contacts/${cId}/tasks/${tId}/completed`, { body: d }); }

  // ==================== CONVERSATIONS ====================
  searchConversations(q = {}) { return this.request("GET", "/conversations/search", { query: this._loc(q) }); }
  getConversation(id) { return this.request("GET", `/conversations/${id}`); }
  createConversation(d) { return this.request("POST", "/conversations/", { body: this._loc(d) }); }
  updateConversation(id, d) { return this.request("PUT", `/conversations/${id}`, { body: d }); }
  deleteConversation(id) { return this.request("DELETE", `/conversations/${id}`); }
  getMessages(convId, q = {}) { return this.request("GET", `/conversations/${convId}/messages`, { query: q }); }
  sendMessage(d) { return this.request("POST", "/conversations/messages", { body: d }); }
  addInboundMessage(d) { return this.request("POST", "/conversations/messages/inbound", { body: d }); }
  addOutboundCall(d) { return this.request("POST", "/conversations/messages/outbound", { body: d }); }
  getEmailById(id) { return this.request("GET", `/conversations/messages/email/${id}`); }
  getMessageById(id) { return this.request("GET", `/conversations/messages/${id}`); }
  updateMessageStatus(id, d) { return this.request("PUT", `/conversations/messages/${id}/status`, { body: d }); }
  cancelScheduledMessage(id) { return this.request("DELETE", `/conversations/messages/${id}/schedule`); }
  cancelScheduledEmail(id) { return this.request("DELETE", `/conversations/messages/email/${id}/schedule`); }
  getRecording(msgId) { return this.request("GET", `/conversations/messages/${msgId}/locations/${this.locationId}/recording`); }
  getTranscription(msgId) { return this.request("GET", `/conversations/locations/${this.locationId}/messages/${msgId}/transcription`); }
  uploadMessageAttachment(d) { return this.request("POST", "/conversations/messages/upload", { body: d }); }
  sendLiveChatTyping(d) { return this.request("POST", "/conversations/providers/live-chat/typing", { body: d }); }

  // ==================== CALENDARS ====================
  getCalendars(q = {}) { return this.request("GET", "/calendars/", { query: this._loc(q) }); }
  getCalendar(id) { return this.request("GET", `/calendars/${id}`); }
  createCalendar(d) { return this.request("POST", "/calendars/", { body: this._loc(d) }); }
  updateCalendar(id, d) { return this.request("PUT", `/calendars/${id}`, { body: d }); }
  deleteCalendar(id) { return this.request("DELETE", `/calendars/${id}`); }
  getFreeSlots(id, q) { return this.request("GET", `/calendars/${id}/free-slots`, { query: q }); }
  getCalendarEvents(q = {}) { return this.request("GET", "/calendars/events", { query: this._loc(q) }); }
  createAppointment(d) { return this.request("POST", "/calendars/events/appointments", { body: d }); }
  getAppointment(id) { return this.request("GET", `/calendars/events/appointments/${id}`); }
  updateAppointment(id, d) { return this.request("PUT", `/calendars/events/appointments/${id}`, { body: d }); }
  deleteEvent(id) { return this.request("DELETE", `/calendars/events/${id}`); }
  createBlockSlot(d) { return this.request("POST", "/calendars/events/block-slots", { body: d }); }
  updateBlockSlot(id, d) { return this.request("PUT", `/calendars/events/block-slots/${id}`, { body: d }); }
  getBlockedSlots(q = {}) { return this.request("GET", "/calendars/blocked-slots", { query: this._loc(q) }); }
  // Calendar Groups
  getCalendarGroups() { return this.request("GET", "/calendars/groups", this._locQ()); }
  createCalendarGroup(d) { return this.request("POST", "/calendars/groups", { body: this._loc(d) }); }
  updateCalendarGroup(id, d) { return this.request("PUT", `/calendars/groups/${id}`, { body: d }); }
  deleteCalendarGroup(id) { return this.request("DELETE", `/calendars/groups/${id}`); }
  disableCalendarGroup(id, d) { return this.request("PUT", `/calendars/groups/${id}/status`, { body: d }); }
  validateGroupSlug(d) { return this.request("POST", "/calendars/groups/validate-slug", { body: d }); }
  // Calendar Resources
  listCalendarResources(type, q = {}) { return this.request("GET", `/calendars/resources/${type}`, { query: this._loc(q) }); }
  createCalendarResource(type, d) { return this.request("POST", `/calendars/resources/${type}`, { body: this._loc(d) }); }
  getCalendarResource(type, id) { return this.request("GET", `/calendars/resources/${type}/${id}`); }
  updateCalendarResource(type, id, d) { return this.request("PUT", `/calendars/resources/${type}/${id}`, { body: d }); }
  deleteCalendarResource(type, id) { return this.request("DELETE", `/calendars/resources/${type}/${id}`); }
  // Calendar Notifications
  getCalendarNotifications(calId) { return this.request("GET", `/calendars/${calId}/notifications`); }
  createCalendarNotification(calId, d) { return this.request("POST", `/calendars/${calId}/notifications`, { body: d }); }
  updateCalendarNotification(calId, nId, d) { return this.request("PUT", `/calendars/${calId}/notifications/${nId}`, { body: d }); }
  deleteCalendarNotification(calId, nId) { return this.request("DELETE", `/calendars/${calId}/notifications/${nId}`); }
  // Appointment Notes
  getAppointmentNotes(apptId) { return this.request("GET", `/calendars/appointments/${apptId}/notes`); }
  createAppointmentNote(apptId, d) { return this.request("POST", `/calendars/appointments/${apptId}/notes`, { body: d }); }
  updateAppointmentNote(apptId, nId, d) { return this.request("PUT", `/calendars/appointments/${apptId}/notes/${nId}`, { body: d }); }
  deleteAppointmentNote(apptId, nId) { return this.request("DELETE", `/calendars/appointments/${apptId}/notes/${nId}`); }

  // ==================== OPPORTUNITIES / PIPELINES ====================
  searchOpportunities(q = {}) { return this.request("GET", "/opportunities/search", { query: { location_id: this.locationId, ...q } }); }
  getOpportunity(id) { return this.request("GET", `/opportunities/${id}`); }
  createOpportunity(d) { return this.request("POST", "/opportunities/", { body: this._loc(d) }); }
  updateOpportunity(id, d) { return this.request("PUT", `/opportunities/${id}`, { body: d }); }
  deleteOpportunity(id) { return this.request("DELETE", `/opportunities/${id}`); }
  updateOpportunityStatus(id, status) { return this.request("PUT", `/opportunities/${id}/status`, { body: { status } }); }
  upsertOpportunity(d) { return this.request("POST", "/opportunities/upsert", { body: this._loc(d) }); }
  addOpportunityFollowers(id, d) { return this.request("POST", `/opportunities/${id}/followers`, { body: d }); }
  removeOpportunityFollowers(id, d) { return this.request("DELETE", `/opportunities/${id}/followers`, { body: d }); }
  getPipelines() { return this.request("GET", "/opportunities/pipelines", this._locQ()); }

  // ==================== WORKFLOWS & CAMPAIGNS ====================
  getWorkflows(q = {}) { return this.request("GET", "/workflows/", { query: this._loc(q) }); }
  getCampaigns(q = {}) { return this.request("GET", "/campaigns/", { query: this._loc(q) }); }

  // ==================== USERS ====================
  getUsers(q = {}) { return this.request("GET", "/users/", { query: this._loc(q) }); }
  getUser(id) { return this.request("GET", `/users/${id}`); }
  createUser(d) { return this.request("POST", "/users/", { body: d }); }
  updateUser(id, d) { return this.request("PUT", `/users/${id}`, { body: d }); }
  deleteUser(id) { return this.request("DELETE", `/users/${id}`); }
  searchUsers(q = {}) { return this.request("GET", "/users/search", { query: this._loc(q) }); }

  // ==================== BUSINESSES ====================
  getBusinesses(q = {}) { return this.request("GET", "/businesses/", { query: this._loc(q) }); }
  getBusiness(id) { return this.request("GET", `/businesses/${id}`); }
  createBusiness(d) { return this.request("POST", "/businesses/", { body: this._loc(d) }); }
  updateBusiness(id, d) { return this.request("PUT", `/businesses/${id}`, { body: d }); }
  deleteBusiness(id) { return this.request("DELETE", `/businesses/${id}`); }

  // ==================== INVOICES ====================
  listInvoices(q = {}) { return this.request("GET", "/invoices/", { query: this._loc(q) }); }
  getInvoice(id) { return this.request("GET", `/invoices/${id}`, this._locQ()); }
  createInvoice(d) { return this.request("POST", "/invoices/", { body: this._loc(d) }); }
  updateInvoice(id, d) { return this.request("PUT", `/invoices/${id}`, { body: d }); }
  deleteInvoice(id) { return this.request("DELETE", `/invoices/${id}`, this._locQ()); }
  sendInvoice(id, d = {}) { return this.request("POST", `/invoices/${id}/send`, { body: this._loc(d) }); }
  voidInvoice(id) { return this.request("POST", `/invoices/${id}/void`, { body: this._loc() }); }
  recordInvoicePayment(id, d) { return this.request("POST", `/invoices/${id}/record-payment`, { body: this._loc(d) }); }
  generateInvoiceNumber() { return this.request("GET", "/invoices/generate-invoice-number", this._locQ()); }
  sendText2Pay(d) { return this.request("POST", "/invoices/text2pay", { body: this._loc(d) }); }
  // Invoice Schedules
  listInvoiceSchedules(q = {}) { return this.request("GET", "/invoices/schedule", { query: this._loc(q) }); }
  getInvoiceSchedule(id) { return this.request("GET", `/invoices/schedule/${id}`, this._locQ()); }
  createInvoiceSchedule(d) { return this.request("POST", "/invoices/schedule", { body: this._loc(d) }); }
  updateInvoiceSchedule(id, d) { return this.request("PUT", `/invoices/schedule/${id}`, { body: d }); }
  deleteInvoiceSchedule(id) { return this.request("DELETE", `/invoices/schedule/${id}`, this._locQ()); }
  cancelInvoiceSchedule(id) { return this.request("POST", `/invoices/schedule/${id}/cancel`, { body: this._loc() }); }
  // Invoice Templates
  listInvoiceTemplates(q = {}) { return this.request("GET", "/invoices/template", { query: this._loc(q) }); }
  getInvoiceTemplate(id) { return this.request("GET", `/invoices/template/${id}`, this._locQ()); }
  createInvoiceTemplate(d) { return this.request("POST", "/invoices/template", { body: this._loc(d) }); }
  updateInvoiceTemplate(id, d) { return this.request("PUT", `/invoices/template/${id}`, { body: d }); }
  deleteInvoiceTemplate(id) { return this.request("DELETE", `/invoices/template/${id}`, this._locQ()); }
  // Estimates
  listEstimates(q = {}) { return this.request("GET", "/invoices/estimate/list", { query: this._loc(q) }); }
  createEstimate(d) { return this.request("POST", "/invoices/estimate", { body: this._loc(d) }); }
  updateEstimate(id, d) { return this.request("PUT", `/invoices/estimate/${id}`, { body: d }); }
  deleteEstimate(id) { return this.request("DELETE", `/invoices/estimate/${id}`, this._locQ()); }
  sendEstimate(id, d = {}) { return this.request("POST", `/invoices/estimate/${id}/send`, { body: this._loc(d) }); }
  createInvoiceFromEstimate(id) { return this.request("POST", `/invoices/estimate/${id}/invoice`, { body: this._loc() }); }
  listEstimateTemplates(q = {}) { return this.request("GET", "/invoices/estimate/template", { query: this._loc(q) }); }
  createEstimateTemplate(d) { return this.request("POST", "/invoices/estimate/template", { body: this._loc(d) }); }
  updateEstimateTemplate(id, d) { return this.request("PUT", `/invoices/estimate/template/${id}`, { body: d }); }
  deleteEstimateTemplate(id) { return this.request("DELETE", `/invoices/estimate/template/${id}`, this._locQ()); }

  // ==================== PAYMENTS ====================
  listOrders(q = {}) { return this.request("GET", "/payments/orders", { query: this._loc(q) }); }
  getOrder(id) { return this.request("GET", `/payments/orders/${id}`, this._locQ()); }
  listOrderFulfillments(id) { return this.request("GET", `/payments/orders/${id}/fulfillments`, this._locQ()); }
  createOrderFulfillment(id, d) { return this.request("POST", `/payments/orders/${id}/fulfillments`, { body: this._loc(d) }); }
  listOrderNotes(id) { return this.request("GET", `/payments/orders/${id}/notes`, this._locQ()); }
  recordOrderPayment(id, d) { return this.request("POST", `/payments/orders/${id}/record-payment`, { body: this._loc(d) }); }
  listTransactions(q = {}) { return this.request("GET", "/payments/transactions", { query: this._loc(q) }); }
  getTransaction(id) { return this.request("GET", `/payments/transactions/${id}`, this._locQ()); }
  listSubscriptions(q = {}) { return this.request("GET", "/payments/subscriptions", { query: this._loc(q) }); }
  getSubscription(id) { return this.request("GET", `/payments/subscriptions/${id}`, this._locQ()); }
  // Coupons
  listCoupons(q = {}) { return this.request("GET", "/payments/coupon/list", { query: this._loc(q) }); }
  getCoupon(q) { return this.request("GET", "/payments/coupon", { query: this._loc(q) }); }
  createCoupon(d) { return this.request("POST", "/payments/coupon", { body: this._loc(d) }); }
  updateCoupon(d) { return this.request("PUT", "/payments/coupon", { body: this._loc(d) }); }
  deleteCoupon(q) { return this.request("DELETE", "/payments/coupon", { query: this._loc(q) }); }
  // Custom Payment Providers
  getCustomPaymentProvider(q = {}) { return this.request("GET", "/payments/custom-provider/connect", { query: this._loc(q) }); }
  createCustomPaymentProvider(d) { return this.request("POST", "/payments/custom-provider/connect", { body: this._loc(d) }); }
  disconnectCustomPaymentProvider(d) { return this.request("POST", "/payments/custom-provider/disconnect", { body: this._loc(d) }); }
  // Payment Integrations
  listWhitelabelProviders(q = {}) { return this.request("GET", "/payments/integrations/provider/whitelabel", { query: this._loc(q) }); }

  // ==================== FORMS & SURVEYS ====================
  getForms(q = {}) { return this.request("GET", "/forms/", { query: this._loc(q) }); }
  getFormSubmissions(q = {}) { return this.request("GET", "/forms/submissions", { query: this._loc(q) }); }
  getSurveys(q = {}) { return this.request("GET", "/surveys/", { query: this._loc(q) }); }
  getSurveySubmissions(q = {}) { return this.request("GET", "/surveys/submissions", { query: this._loc(q) }); }

  // ==================== PRODUCTS ====================
  listProducts(q = {}) { return this.request("GET", "/products/", { query: this._loc(q) }); }
  getProduct(id) { return this.request("GET", `/products/${id}`, this._locQ()); }
  createProduct(d) { return this.request("POST", "/products/", { body: this._loc(d) }); }
  updateProduct(id, d) { return this.request("PUT", `/products/${id}`, { body: d }); }
  deleteProduct(id) { return this.request("DELETE", `/products/${id}`, this._locQ()); }
  // Product Prices
  listProductPrices(pId) { return this.request("GET", `/products/${pId}/price`, this._locQ()); }
  getProductPrice(pId, prId) { return this.request("GET", `/products/${pId}/price/${prId}`, this._locQ()); }
  createProductPrice(pId, d) { return this.request("POST", `/products/${pId}/price`, { body: this._loc(d) }); }
  updateProductPrice(pId, prId, d) { return this.request("PUT", `/products/${pId}/price/${prId}`, { body: d }); }
  deleteProductPrice(pId, prId) { return this.request("DELETE", `/products/${pId}/price/${prId}`, this._locQ()); }
  // Product Collections
  listProductCollections(q = {}) { return this.request("GET", "/products/collections", { query: this._loc(q) }); }
  getProductCollection(id) { return this.request("GET", `/products/collections/${id}`, this._locQ()); }
  createProductCollection(d) { return this.request("POST", "/products/collections", { body: this._loc(d) }); }
  updateProductCollection(id, d) { return this.request("PUT", `/products/collections/${id}`, { body: d }); }
  deleteProductCollection(id) { return this.request("DELETE", `/products/collections/${id}`, this._locQ()); }
  // Product Inventory & Reviews
  listInventory(q = {}) { return this.request("GET", "/products/inventory", { query: this._loc(q) }); }
  updateInventory(d) { return this.request("POST", "/products/inventory", { body: this._loc(d) }); }
  listProductReviews(q = {}) { return this.request("GET", "/products/reviews", { query: this._loc(q) }); }
  updateProductReview(id, d) { return this.request("PUT", `/products/reviews/${id}`, { body: d }); }
  deleteProductReview(id) { return this.request("DELETE", `/products/reviews/${id}`, this._locQ()); }

  // ==================== FUNNELS ====================
  listFunnels(q = {}) { return this.request("GET", "/funnels/funnel/list", { query: this._loc(q) }); }
  listFunnelPages(q = {}) { return this.request("GET", "/funnels/page", { query: this._loc(q) }); }
  getFunnelPageCount(q = {}) { return this.request("GET", "/funnels/page/count", { query: this._loc(q) }); }
  // Funnel Redirects
  listFunnelRedirects(q = {}) { return this.request("GET", "/funnels/lookup/redirect/list", { query: this._loc(q) }); }
  createFunnelRedirect(d) { return this.request("POST", "/funnels/lookup/redirect", { body: this._loc(d) }); }
  updateFunnelRedirect(id, d) { return this.request("PATCH", `/funnels/lookup/redirect/${id}`, { body: d }); }
  deleteFunnelRedirect(id) { return this.request("DELETE", `/funnels/lookup/redirect/${id}`, this._locQ()); }

  // ==================== BLOGS ====================
  getBlogSites(q = {}) { return this.request("GET", "/blogs/site/all", { query: this._loc(q) }); }
  getBlogsList(q = {}) { return this.request("GET", "/blogs/list", { query: this._loc(q) }); }
  getBlogPosts(q = {}) { return this.request("GET", "/blogs/posts/all", { query: this._loc(q) }); }
  createBlogPost(d) { return this.request("POST", "/blogs/posts", { body: this._loc(d) }); }
  updateBlogPost(id, d) { return this.request("PUT", `/blogs/posts/${id}`, { body: d }); }
  checkBlogSlug(q) { return this.request("GET", "/blogs/posts/url-slug-exists", { query: this._loc(q) }); }
  getBlogAuthors(q = {}) { return this.request("GET", "/blogs/authors", { query: this._loc(q) }); }
  getBlogCategories(q = {}) { return this.request("GET", "/blogs/categories", { query: this._loc(q) }); }

  // ==================== SOCIAL MEDIA PLANNER ====================
  getSocialAccounts() { return this.request("GET", `/social-media-posting/${this.locationId}/accounts`); }
  deleteSocialAccount(id) { return this.request("DELETE", `/social-media-posting/${this.locationId}/accounts/${id}`); }
  getSocialPosts(d = {}) { return this.request("POST", `/social-media-posting/${this.locationId}/posts/list`, { body: d }); }
  createSocialPost(d) { return this.request("POST", `/social-media-posting/${this.locationId}/posts`, { body: d }); }
  getSocialPost(id) { return this.request("GET", `/social-media-posting/${this.locationId}/posts/${id}`); }
  updateSocialPost(id, d) { return this.request("PUT", `/social-media-posting/${this.locationId}/posts/${id}`, { body: d }); }
  deleteSocialPost(id) { return this.request("DELETE", `/social-media-posting/${this.locationId}/posts/${id}`); }
  bulkDeleteSocialPosts(d) { return this.request("POST", `/social-media-posting/${this.locationId}/posts/bulk-delete`, { body: d }); }
  getSocialCategories() { return this.request("GET", `/social-media-posting/${this.locationId}/categories`); }
  getSocialTags() { return this.request("GET", `/social-media-posting/${this.locationId}/tags`); }
  getSocialStatistics(d) { return this.request("POST", "/social-media-posting/statistics", { body: this._loc(d) }); }

  // ==================== LOCATIONS / SUB-ACCOUNTS ====================
  getLocation(id) { return this.request("GET", `/locations/${id || this.locationId}`); }
  updateLocation(d) { return this.request("PUT", `/locations/${this.locationId}`, { body: d }); }
  searchLocations(q = {}) { return this.request("GET", "/locations/search", { query: q }); }
  getLocationTags(q = {}) { return this.request("GET", `/locations/${this.locationId}/tags`, { query: q }); }
  getTagById(id) { return this.request("GET", `/locations/${this.locationId}/tags/${id}`); }
  createTag(d) { return this.request("POST", `/locations/${this.locationId}/tags`, { body: d }); }
  updateTag(id, d) { return this.request("PUT", `/locations/${this.locationId}/tags/${id}`, { body: d }); }
  deleteTag(id) { return this.request("DELETE", `/locations/${this.locationId}/tags/${id}`); }
  getLocationCustomFields() { return this.request("GET", `/locations/${this.locationId}/customFields`); }
  createLocationCustomField(d) { return this.request("POST", `/locations/${this.locationId}/customFields`, { body: d }); }
  updateLocationCustomField(id, d) { return this.request("PUT", `/locations/${this.locationId}/customFields/${id}`, { body: d }); }
  deleteLocationCustomField(id) { return this.request("DELETE", `/locations/${this.locationId}/customFields/${id}`); }
  getLocationCustomValues() { return this.request("GET", `/locations/${this.locationId}/customValues`); }
  createLocationCustomValue(d) { return this.request("POST", `/locations/${this.locationId}/customValues`, { body: d }); }
  updateLocationCustomValue(id, d) { return this.request("PUT", `/locations/${this.locationId}/customValues/${id}`, { body: d }); }
  deleteLocationCustomValue(id) { return this.request("DELETE", `/locations/${this.locationId}/customValues/${id}`); }
  getLocationTemplates(q = {}) { return this.request("GET", `/locations/${this.locationId}/templates`, { query: q }); }
  deleteLocationTemplate(id) { return this.request("DELETE", `/locations/${this.locationId}/templates/${id}`); }
  getLocationTimezones() { return this.request("GET", `/locations/${this.locationId}/timezones`); }
  // Location Tasks
  searchLocationTasks(d) { return this.request("POST", `/locations/${this.locationId}/tasks/search`, { body: d }); }
  // Recurring Tasks
  createRecurringTask(d) { return this.request("POST", `/locations/${this.locationId}/recurring-tasks`, { body: d }); }
  getRecurringTask(id) { return this.request("GET", `/locations/${this.locationId}/recurring-tasks/${id}`); }
  updateRecurringTask(id, d) { return this.request("PUT", `/locations/${this.locationId}/recurring-tasks/${id}`, { body: d }); }
  deleteRecurringTask(id) { return this.request("DELETE", `/locations/${this.locationId}/recurring-tasks/${id}`); }

  // ==================== TRIGGER LINKS ====================
  getLinks(q = {}) { return this.request("GET", "/links/", { query: this._loc(q) }); }
  getLinkById(id) { return this.request("GET", `/links/id/${id}`); }
  searchLinks(q = {}) { return this.request("GET", "/links/search", { query: this._loc(q) }); }
  createLink(d) { return this.request("POST", "/links/", { body: this._loc(d) }); }
  updateLink(id, d) { return this.request("PUT", `/links/${id}`, { body: d }); }
  deleteLink(id) { return this.request("DELETE", `/links/${id}`); }

  // ==================== EMAILS ====================
  getEmailTemplates(q = {}) { return this.request("GET", "/emails/builder", { query: this._loc(q) }); }
  createEmailTemplate(d) { return this.request("POST", "/emails/builder", { body: this._loc(d) }); }
  updateEmailTemplate(d) { return this.request("POST", "/emails/builder/data", { body: this._loc(d) }); }
  deleteEmailTemplate(templateId) { return this.request("DELETE", `/emails/builder/${this.locationId}/${templateId}`); }
  getEmailSchedules(q = {}) { return this.request("GET", "/emails/schedule", { query: this._loc(q) }); }
  verifyEmail(d) { return this.request("POST", "/email/verify", { body: d }); }

  // ==================== MEDIA LIBRARY ====================
  getMediaFiles(q = {}) { return this.request("GET", "/medias/files", { query: this._loc(q) }); }
  uploadMediaFile(d) { return this.request("POST", "/medias/upload-file", { body: this._loc(d) }); }
  createMediaFolder(d) { return this.request("POST", "/medias/folder", { body: this._loc(d) }); }
  updateMediaFile(id, d) { return this.request("POST", `/medias/${id}`, { body: this._loc(d) }); }
  deleteMediaFile(id) { return this.request("DELETE", `/medias/${id}`, this._locQ()); }
  bulkDeleteMedia(d) { return this.request("PUT", "/medias/delete-files", { body: this._loc(d) }); }
  bulkUpdateMedia(d) { return this.request("PUT", "/medias/update-files", { body: this._loc(d) }); }

  // ==================== OBJECTS (Custom Objects) ====================
  getObjects(q = {}) { return this.request("GET", "/objects/", { query: this._loc(q) }); }
  getObjectSchema(key) { return this.request("GET", `/objects/${key}`, this._locQ()); }
  createObjectSchema(d) { return this.request("POST", "/objects/", { body: this._loc(d) }); }
  updateObjectSchema(key, d) { return this.request("PUT", `/objects/${key}`, { body: d }); }
  // Object Records
  searchObjectRecords(schemaKey, d) { return this.request("POST", `/objects/${schemaKey}/records/search`, { body: this._loc(d) }); }
  getObjectRecord(schemaKey, id) { return this.request("GET", `/objects/${schemaKey}/records/${id}`, this._locQ()); }
  createObjectRecord(schemaKey, d) { return this.request("POST", `/objects/${schemaKey}/records`, { body: this._loc(d) }); }
  updateObjectRecord(schemaKey, id, d) { return this.request("PUT", `/objects/${schemaKey}/records/${id}`, { body: d }); }
  deleteObjectRecord(schemaKey, id) { return this.request("DELETE", `/objects/${schemaKey}/records/${id}`, this._locQ()); }

  // ==================== ASSOCIATIONS ====================
  getAssociations(q = {}) { return this.request("GET", "/associations/", { query: this._loc(q) }); }
  getAssociation(id) { return this.request("GET", `/associations/${id}`, this._locQ()); }
  getAssociationByKey(key) { return this.request("GET", `/associations/key/${key}`, this._locQ()); }
  getAssociationsByObjectKey(objKey) { return this.request("GET", `/associations/objectKey/${objKey}`, this._locQ()); }
  createAssociation(d) { return this.request("POST", "/associations/", { body: this._loc(d) }); }
  updateAssociation(id, d) { return this.request("PUT", `/associations/${id}`, { body: d }); }
  deleteAssociation(id) { return this.request("DELETE", `/associations/${id}`, this._locQ()); }
  // Association Relations
  getRelations(recordId, q = {}) { return this.request("GET", `/associations/relations/${recordId}`, { query: this._loc(q) }); }
  createRelation(d) { return this.request("POST", "/associations/relations", { body: this._loc(d) }); }
  deleteRelation(id) { return this.request("DELETE", `/associations/relations/${id}`, this._locQ()); }

  // ==================== CUSTOM FIELDS V2 ====================
  getCustomFieldsByObjectKey(objKey) { return this.request("GET", `/custom-fields/object-key/${objKey}`, this._locQ()); }
  getCustomFieldById(id) { return this.request("GET", `/custom-fields/${id}`, this._locQ()); }
  createCustomField(d) { return this.request("POST", "/custom-fields/", { body: this._loc(d) }); }
  updateCustomField(id, d) { return this.request("PUT", `/custom-fields/${id}`, { body: d }); }
  deleteCustomField(id) { return this.request("DELETE", `/custom-fields/${id}`, this._locQ()); }
  createCustomFieldFolder(d) { return this.request("POST", "/custom-fields/folder", { body: this._loc(d) }); }
  updateCustomFieldFolder(id, d) { return this.request("PUT", `/custom-fields/folder/${id}`, { body: d }); }
  deleteCustomFieldFolder(id) { return this.request("DELETE", `/custom-fields/folder/${id}`, this._locQ()); }

  // ==================== COURSES ====================
  importCourses(d) { return this.request("POST", "/courses/courses-exporter/public/import", { body: this._loc(d) }); }

  // ==================== STORE ====================
  getStoreSettings(q = {}) { return this.request("GET", "/store/store-setting", { query: this._loc(q) }); }
  updateStoreSettings(d) { return this.request("POST", "/store/store-setting", { body: this._loc(d) }); }
  listShippingCarriers(q = {}) { return this.request("GET", "/store/shipping-carrier", { query: this._loc(q) }); }
  getShippingCarrier(id) { return this.request("GET", `/store/shipping-carrier/${id}`, this._locQ()); }
  createShippingCarrier(d) { return this.request("POST", "/store/shipping-carrier", { body: this._loc(d) }); }
  updateShippingCarrier(id, d) { return this.request("PUT", `/store/shipping-carrier/${id}`, { body: d }); }
  deleteShippingCarrier(id) { return this.request("DELETE", `/store/shipping-carrier/${id}`, this._locQ()); }
  listShippingZones(q = {}) { return this.request("GET", "/store/shipping-zone", { query: this._loc(q) }); }
  getShippingZone(id) { return this.request("GET", `/store/shipping-zone/${id}`, this._locQ()); }
  createShippingZone(d) { return this.request("POST", "/store/shipping-zone", { body: this._loc(d) }); }
  updateShippingZone(id, d) { return this.request("PUT", `/store/shipping-zone/${id}`, { body: d }); }
  deleteShippingZone(id) { return this.request("DELETE", `/store/shipping-zone/${id}`, this._locQ()); }

  // ==================== SAAS ====================
  getSaasSubscription() { return this.request("GET", `/saas-api/public-api/get-saas-subscription/${this.locationId}`); }
  updateSaasSubscription(d) { return this.request("PUT", `/saas-api/public-api/update-saas-subscription/${this.locationId}`, { body: d }); }
  enableSaas(d) { return this.request("POST", `/saas-api/public-api/enable-saas/${this.locationId}`, { body: d }); }

  // ==================== SNAPSHOTS ====================
  getSnapshots(q = {}) { return this.request("GET", "/snapshots/", { query: q }); }
  createSnapshotShareLink(d) { return this.request("POST", "/snapshots/share/link", { body: d }); }
  getSnapshotStatus(snapshotId, q = {}) { return this.request("GET", `/snapshots/snapshot-status/${snapshotId}`, { query: q }); }

  // ==================== VOICE AI ====================
  listVoiceAgents(q = {}) { return this.request("GET", "/voice-ai/agents", { query: this._loc(q) }); }
  getVoiceAgent(id) { return this.request("GET", `/voice-ai/agents/${id}`, this._locQ()); }
  createVoiceAgent(d) { return this.request("POST", "/voice-ai/agents", { body: this._loc(d) }); }
  updateVoiceAgent(id, d) { return this.request("PATCH", `/voice-ai/agents/${id}`, { body: d }); }
  deleteVoiceAgent(id) { return this.request("DELETE", `/voice-ai/agents/${id}`, this._locQ()); }
  getVoiceAgentAction(id) { return this.request("GET", `/voice-ai/actions/${id}`, this._locQ()); }
  createVoiceAgentAction(d) { return this.request("POST", "/voice-ai/actions", { body: this._loc(d) }); }
  updateVoiceAgentAction(id, d) { return this.request("PUT", `/voice-ai/actions/${id}`, { body: d }); }
  deleteVoiceAgentAction(id) { return this.request("DELETE", `/voice-ai/actions/${id}`, this._locQ()); }
  listVoiceCallLogs(q = {}) { return this.request("GET", "/voice-ai/dashboard/call-logs", { query: this._loc(q) }); }
  getVoiceCallLog(id) { return this.request("GET", `/voice-ai/dashboard/call-logs/${id}`, this._locQ()); }

  // ==================== DOCUMENTS & CONTRACTS ====================
  listDocuments(q = {}) { return this.request("GET", "/proposals/document", { query: this._loc(q) }); }
  sendDocument(d) { return this.request("POST", "/proposals/document/send", { body: this._loc(d) }); }
  listDocumentTemplates(q = {}) { return this.request("GET", "/proposals/templates", { query: this._loc(q) }); }
  sendDocumentTemplate(d) { return this.request("POST", "/proposals/templates/send", { body: this._loc(d) }); }

  // ==================== PHONE SYSTEM ====================
  listPhoneNumbers() { return this.request("GET", `/phone-system/numbers/location/${this.locationId}`); }
  listNumberPools(q = {}) { return this.request("GET", "/phone-system/number-pools", { query: this._loc(q) }); }

  // ==================== COMPANIES ====================
  getCompany(id) { return this.request("GET", `/companies/${id}`); }

  // ==================== CUSTOM MENUS ====================
  getCustomMenus(q = {}) { return this.request("GET", "/custom-menus/", { query: this._loc(q) }); }
  getCustomMenu(id) { return this.request("GET", `/custom-menus/${id}`, this._locQ()); }
  createCustomMenu(d) { return this.request("POST", "/custom-menus/", { body: this._loc(d) }); }
  updateCustomMenu(id, d) { return this.request("PUT", `/custom-menus/${id}`, { body: d }); }
  deleteCustomMenu(id) { return this.request("DELETE", `/custom-menus/${id}`, this._locQ()); }
}
