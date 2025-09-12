// Comprehensive Data Model for Konipa B2B Platform
// This file defines the structure for all entities in the system

// Users with enhanced RBAC
export const userSchema = {
  id: 'string',
  email: 'string',
  password: 'string', // Will be hashed in production
  role: 'enum[admin, accountant, commercial, pos, client]',
  firstName: 'string',
  lastName: 'string',
  company: 'string',
  phone: 'string',
  address: 'object',
  permissions: 'array',
  isActive: 'boolean',
  lastLogin: 'datetime',
  createdAt: 'datetime',
  updatedAt: 'datetime',
  preferences: 'object',
  avatar: 'string'
};

// Clients (B2B customers)
export const clientSchema = {
  id: 'string',
  companyName: 'string',
  contactPerson: 'string',
  email: 'string',
  phone: 'string',
  address: 'object',
  taxId: 'string',
  creditLimit: 'number',
  currentBalance: 'number',
  paymentTerms: 'number', // days
  isBlocked: 'boolean',
  blockReason: 'string',
  assignedCommercialId: 'string',
  regionId: 'string',
  createdAt: 'datetime',
  updatedAt: 'datetime',
  notes: 'string'
};

// Products with enhanced attributes
export const productSchema = {
  id: 'string',
  name: 'string',
  brand: 'string',
  reference: 'string',
  description: 'string',
  category: 'string',
  subcategory: 'string',
  basePrice: 'number',
  cost: 'number',
  margin: 'number',
  stock: 'number',
  minStock: 'number',
  maxStock: 'number',
  unit: 'string',
  weight: 'number',
  dimensions: 'object',
  images: 'array',
  specifications: 'object',
  features: 'array',
  warranty: 'string',
  isActive: 'boolean',
  createdAt: 'datetime',
  updatedAt: 'datetime',
  tags: 'array'
};

// Pricing Rules for client-specific pricing
export const pricingRuleSchema = {
  id: 'string',
  clientId: 'string',
  productId: 'string',
  ruleType: 'enum[fixed_price, percentage_discount, quantity_discount]',
  value: 'number',
  minQuantity: 'number',
  maxQuantity: 'number',
  validFrom: 'datetime',
  validTo: 'datetime',
  isActive: 'boolean',
  createdBy: 'string',
  createdAt: 'datetime'
};

// Orders
export const orderSchema = {
  id: 'string',
  clientId: 'string',
  commercialId: 'string',
  status: 'enum[draft, pending, confirmed, processing, shipped, delivered, cancelled]',
  orderDate: 'datetime',
  requiredDate: 'datetime',
  actualDeliveryDate: 'datetime',
  subtotal: 'number',
  taxAmount: 'number',
  discountAmount: 'number',
  shippingCost: 'number',
  totalAmount: 'number',
  currency: 'string',
  notes: 'string',
  shippingAddress: 'object',
  billingAddress: 'object',
  trackingNumber: 'string',
  carrierId: 'string',
  createdAt: 'datetime',
  updatedAt: 'datetime'
};

// Order Items
export const orderItemSchema = {
  id: 'string',
  orderId: 'string',
  productId: 'string',
  quantity: 'number',
  unitPrice: 'number',
  discountPercent: 'number',
  discountAmount: 'number',
  totalPrice: 'number',
  notes: 'string'
};

// Bon de Livraison (Delivery Notes)
export const deliveryNoteSchema = {
  id: 'string',
  orderId: 'string',
  blNumber: 'string',
  deliveryDate: 'datetime',
  deliveredBy: 'string',
  receivedBy: 'string',
  status: 'enum[pending, delivered, returned]',
  notes: 'string',
  signature: 'string',
  createdAt: 'datetime'
};

// Invoices
export const invoiceSchema = {
  id: 'string',
  orderId: 'string',
  clientId: 'string',
  invoiceNumber: 'string',
  invoiceDate: 'datetime',
  dueDate: 'datetime',
  subtotal: 'number',
  taxAmount: 'number',
  totalAmount: 'number',
  paidAmount: 'number',
  remainingAmount: 'number',
  status: 'enum[draft, sent, paid, overdue, cancelled]',
  paymentTerms: 'number',
  notes: 'string',
  createdAt: 'datetime',
  updatedAt: 'datetime'
};

// Payments
export const paymentSchema = {
  id: 'string',
  invoiceId: 'string',
  clientId: 'string',
  amount: 'number',
  paymentDate: 'datetime',
  paymentMethod: 'enum[cash, check, transfer, card]',
  reference: 'string',
  status: 'enum[pending, confirmed, failed]',
  notes: 'string',
  processedBy: 'string',
  createdAt: 'datetime'
};

// Approvals (for accounting workflow)
export const approvalSchema = {
  id: 'string',
  entityType: 'enum[invoice, payment, order, credit_note]',
  entityId: 'string',
  requestedBy: 'string',
  approvedBy: 'string',
  status: 'enum[pending, approved, rejected]',
  reason: 'string',
  requestDate: 'datetime',
  responseDate: 'datetime',
  notes: 'string'
};

// Unpaid Management
export const unpaidSchema = {
  id: 'string',
  clientId: 'string',
  invoiceId: 'string',
  amount: 'number',
  dueDate: 'datetime',
  daysOverdue: 'number',
  status: 'enum[pending, disputed, approved, resolved]',
  lastReminderDate: 'datetime',
  reminderCount: 'number',
  notes: 'string',
  assignedTo: 'string',
  createdAt: 'datetime',
  updatedAt: 'datetime'
};

// Regions for territory management
export const regionSchema = {
  id: 'string',
  name: 'string',
  code: 'string',
  description: 'string',
  isActive: 'boolean',
  createdAt: 'datetime'
};

// Commercial Assignments
export const assignmentSchema = {
  id: 'string',
  commercialId: 'string',
  clientId: 'string',
  regionId: 'string',
  assignedDate: 'datetime',
  isActive: 'boolean',
  notes: 'string'
};

// Commission Policies
export const commissionPolicySchema = {
  id: 'string',
  name: 'string',
  type: 'enum[percentage, fixed, tiered]',
  value: 'number',
  minAmount: 'number',
  maxAmount: 'number',
  productCategories: 'array',
  clientTypes: 'array',
  validFrom: 'datetime',
  validTo: 'datetime',
  isActive: 'boolean',
  createdAt: 'datetime'
};

// Commission Statements
export const commissionStatementSchema = {
  id: 'string',
  commercialId: 'string',
  period: 'string', // YYYY-MM
  totalSales: 'number',
  commissionAmount: 'number',
  status: 'enum[draft, calculated, approved, paid]',
  calculatedDate: 'datetime',
  approvedDate: 'datetime',
  paidDate: 'datetime',
  notes: 'string'
};

// Inventory Transactions
export const inventoryTransactionSchema = {
  id: 'string',
  productId: 'string',
  type: 'enum[in, out, adjustment, transfer]',
  quantity: 'number',
  unitCost: 'number',
  totalCost: 'number',
  reference: 'string',
  reason: 'string',
  warehouseId: 'string',
  userId: 'string',
  createdAt: 'datetime'
};

// Quantity Limits
export const quantityLimitSchema = {
  id: 'string',
  productId: 'string',
  clientId: 'string',
  minQuantity: 'number',
  maxQuantity: 'number',
  period: 'enum[daily, weekly, monthly, yearly]',
  isActive: 'boolean',
  createdAt: 'datetime'
};

// Favorites
export const favoriteSchema = {
  id: 'string',
  userId: 'string',
  productId: 'string',
  createdAt: 'datetime'
};

// Category Mapping
export const categoryMapSchema = {
  id: 'string',
  name: 'string',
  parentId: 'string',
  level: 'number',
  path: 'string',
  isActive: 'boolean',
  sortOrder: 'number',
  createdAt: 'datetime'
};

// Notifications
export const notificationSchema = {
  id: 'string',
  userId: 'string',
  type: 'enum[info, warning, error, success]',
  title: 'string',
  message: 'string',
  isRead: 'boolean',
  actionUrl: 'string',
  metadata: 'object',
  createdAt: 'datetime',
  readAt: 'datetime'
};

// Audit Logs
export const auditLogSchema = {
  id: 'string',
  userId: 'string',
  action: 'string',
  entityType: 'string',
  entityId: 'string',
  oldValues: 'object',
  newValues: 'object',
  ipAddress: 'string',
  userAgent: 'string',
  timestamp: 'datetime'
};

// Export all schemas
export const schemas = {
  user: userSchema,
  client: clientSchema,
  product: productSchema,
  pricingRule: pricingRuleSchema,
  order: orderSchema,
  orderItem: orderItemSchema,
  deliveryNote: deliveryNoteSchema,
  invoice: invoiceSchema,
  payment: paymentSchema,
  approval: approvalSchema,
  unpaid: unpaidSchema,
  region: regionSchema,
  assignment: assignmentSchema,
  commissionPolicy: commissionPolicySchema,
  commissionStatement: commissionStatementSchema,
  inventoryTransaction: inventoryTransactionSchema,
  quantityLimit: quantityLimitSchema,
  favorite: favoriteSchema,
  categoryMap: categoryMapSchema,
  notification: notificationSchema,
  auditLog: auditLogSchema
};

export default schemas;