// config/documentTypes.js
// Central config for document types per user role, accepted file types, and size limits

const DOCUMENT_TYPES = {
  haulier: [
    { type: 'goods_in_transit_insurance', label: 'Goods in Transit Insurance', category: 'insurance', requiresExpiry: true, description: 'Insurance coverage for goods being transported' },
    { type: 'public_liability_insurance', label: 'Public Liability Insurance', category: 'insurance', requiresExpiry: true, description: 'Coverage for third-party injury or property damage' },
    { type: 'operators_license', label: "Operator's License (O-License)", category: 'license', requiresExpiry: true, description: 'Required to operate commercial vehicles in the UK' },
    { type: 'vehicle_registration', label: 'Vehicle Registration (V5C)', category: 'vehicle', requiresExpiry: false, description: 'Registration documents for fleet vehicles' },
    { type: 'mot_certificate', label: 'MOT Certificate', category: 'vehicle', requiresExpiry: true, description: 'Annual roadworthiness test certificate' },
    { type: 'driver_cpc', label: 'Driver CPC Card', category: 'certification', requiresExpiry: true, description: 'Certificate of Professional Competence for drivers' },
    { type: 'adr_certificate', label: 'ADR Certificate', category: 'certification', requiresExpiry: true, description: 'For transporting dangerous goods' },
    { type: 'ecmt_permit', label: 'ECMT Permit', category: 'license', requiresExpiry: true, description: 'For international haulage' },
    { type: 'cmr_insurance', label: 'CMR Insurance', category: 'insurance', requiresExpiry: true, description: 'Convention on the Contract for International Carriage of Goods by Road' }
  ],

  logistics_company: [
    { type: 'business_insurance', label: 'Business Insurance', category: 'insurance', requiresExpiry: true, description: 'Professional Indemnity & Public Liability' },
    { type: 'warehouse_license', label: 'Warehousing/Storage License', category: 'license', requiresExpiry: true, description: 'License to operate warehouse facilities' },
    { type: 'aeo_status', label: 'AEO Status', category: 'certification', requiresExpiry: true, description: 'Authorized Economic Operator status for customs' },
    { type: 'iso_9001', label: 'ISO 9001 Certification', category: 'certification', requiresExpiry: true, description: 'Quality management system certification' },
    { type: 'health_safety_cert', label: 'Health & Safety Certificate', category: 'certification', requiresExpiry: true, description: 'Required for handling food/pharmaceutical goods' },
    { type: 'iata_certification', label: 'IATA Certification', category: 'certification', requiresExpiry: true, description: 'For handling air freight' }
  ],

  manufacturer: [
    { type: 'product_liability_insurance', label: 'Product Liability Insurance', category: 'insurance', requiresExpiry: true, description: 'Coverage for product-related claims' },
    { type: 'iso_certification', label: 'ISO Certification', category: 'certification', requiresExpiry: true, description: 'Quality management certification (ISO 9001, etc.)' },
    { type: 'export_license', label: 'Export License', category: 'license', requiresExpiry: true, description: 'For exporting controlled goods' },
    { type: 'certificate_of_origin', label: 'Certificate of Origin', category: 'certification', requiresExpiry: false, description: 'Certifies country of manufacture' },
    { type: 'safety_data_sheet', label: 'Safety Data Sheet (SDS)', category: 'safety', requiresExpiry: false, description: 'For hazardous materials information' },
    { type: 'business_registration', label: 'Business Registration', category: 'registration', requiresExpiry: false, description: 'Company registration documents' }
  ]
};

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

module.exports = { DOCUMENT_TYPES, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
