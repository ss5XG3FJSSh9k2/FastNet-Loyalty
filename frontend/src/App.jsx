/* global FormData, URLSearchParams */
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Home,
  Smartphone, 
  Settings, 
  Database, 
  Sparkles, 
  ShieldAlert, 
  ArrowRightLeft, 
  UserCheck, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  TrendingUp, 
  Calculator, 
  Plus, 
  Minus, 
  RotateCcw,
  Download,
  AlertCircle,
  Gift,
  Truck,
  Store,
  Key,
  Share2,
  User,
  RefreshCw,
  MessageSquare,
  Search,
  X,
  Signal,
  Package,
  BarChart2,
  AlertTriangle,
  MapPin,
  Phone,
  LogOut,
  HelpCircle,
  Battery,
  Clock,
  ArrowLeft,
  Tv,
  Globe,
  Languages,
  ChevronDown,
  ChevronUp,
  FileText,
  UserPlus,
  CreditCard,
  Timer,
  ShieldOff,
  CheckCheck,
  Ban,
  Banknote,
  Lock,
  Check,
  ArrowRight,
  Edit,
  Star,
  Bell
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const API_BASE = 'http://localhost:3001/api';

export default function App() {
  const isDevMode = new URLSearchParams(window.location.search).has('dev');
  const [activeRole, setActiveRole] = useState('marketing');
  const [dbState, setDbState] = useState(null);
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState(null);
  const [confirmDeliverySwitchOrderId, setConfirmDeliverySwitchOrderId] = useState(null);

  // Setup state (Round BF5d)
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccessAdmin, setSetupSuccessAdmin] = useState(null);
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);

  const checkSetupStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/setup/status`);
      if (res.ok) {
        const data = await res.json();
        setNeedsSetup(data.needs_setup);
      }
    } catch (err) {
      console.error('Error checking setup status:', err);
    }
  };

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const handleCreateAdminSetup = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSetupError('');
    if (!setupName || !setupName.trim()) {
      setSetupError(t('Administrator name is required.', 'प्रशासक का नाम आवश्यक है।', 'প্রশাসকের নাম প্রয়োজন।'));
      return;
    }
    if (!setupPhone || !/^\d{10}$/.test(setupPhone.trim())) {
      setSetupError(t('Please enter a valid 10-digit phone number.', 'कृपया 10 अंकों का मान्य फ़ोन नंबर दर्ज करें।', 'অনুগ্রহ করে একটি বৈধ ১০ সংখ্যার ফোন নম্বর লিখুন।'));
      return;
    }

    setIsSubmittingSetup(true);
    try {
      const res = await fetch(`${API_BASE}/setup/create-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: setupName.trim(), phone: setupPhone.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || 'Failed to create administrator account.');
      } else {
        setSetupSuccessAdmin(data);
        setNeedsSetup(false);
        checkSetupStatus();
      }
    } catch (err) {
      setSetupError('Network error. Failed to create administrator account.');
    } finally {
      setIsSubmittingSetup(false);
    }
  };

  const cancelTimeoutRef = useRef(null);
  const deliverySwitchTimeoutRef = useRef(null);

  useEffect(() => {
    if (activeRole !== 'customer') return;
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [activeRole]);

  const triggerCancelConfirm = (orderId) => {
    if (cancelTimeoutRef.current) clearTimeout(cancelTimeoutRef.current);
    setConfirmCancelOrderId(orderId);
    cancelTimeoutRef.current = setTimeout(() => {
      setConfirmCancelOrderId(null);
    }, 3000);
  };

  const triggerDeliverySwitchConfirm = (orderId) => {
    if (deliverySwitchTimeoutRef.current) clearTimeout(deliverySwitchTimeoutRef.current);
    setConfirmDeliverySwitchOrderId(orderId);
    deliverySwitchTimeoutRef.current = setTimeout(() => {
      setConfirmDeliverySwitchOrderId(null);
    }, 3000);
  };
  
  // Guided Walkthrough Tour State
  const [tourStep, setTourStep] = useState(1);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(0);
  const [calculatorCollapsed, setCalculatorCollapsed] = useState(true);

  // Customer App State
  const [customerStockists, setCustomerStockists] = useState([]);
  const [selectedStockist, setSelectedStockist] = useState(null);
  const [previousStockistId, setPreviousStockistId] = useState(null);
  const [lastSelectedStockist, setLastSelectedStockist] = useState(null);

  useEffect(() => {
    if (previousStockistId && customerStockists.length > 0) {
      if (!customerStockists.some(s => s.id === previousStockistId)) {
        setPreviousStockistId(null);
      }
    }
  }, [customerStockists, previousStockistId]);
  const [customerProducts, setCustomerProducts] = useState([]);
  const [customerCart, setCustomerCart] = useState([]);
  const [cartFulfillment, setCartFulfillment] = useState('PICKUP');
  const [simulatedWaMessage, setSimulatedWaMessage] = useState(null);
  const [customerLedger, setCustomerLedger] = useState([]);
  const [customerBalance, setCustomerBalance] = useState(0);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerAppTab, setCustomerAppTab] = useState('store'); // store, ledger, orders
  const [redeemAmount, setRedeemAmount] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');

  // New expansion states & Round R
  const [previousCustomerTab, setPreviousCustomerTab] = useState('home');
  const [showRedeemConfirmModal, setShowRedeemConfirmModal] = useState(false);
  const [redeemSuccessModal, setRedeemSuccessModal] = useState(false);

  const [showFraudReportModal, setShowFraudReportModal] = useState(false);
  const [fraudSubject, setFraudSubject] = useState('Stockist issue');
  const [fraudDescription, setFraudDescription] = useState('');
  const [fraudLinkedEntityType, setFraudLinkedEntityType] = useState('');
  const [fraudLinkedEntityId, setFraudLinkedEntityId] = useState('');

  const [adminRegionFilter, setAdminRegionFilter] = useState('ALL');
  const [adminTab, setAdminTab] = useState('home');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gettingStartedOpen, setGettingStartedOpen] = useState(true);

  const [adminCustomers, setAdminCustomers] = useState([]);
  const [adminCustomerSearch, setAdminCustomerSearch] = useState('');
  const [adminIncludeInactiveCustomers, setAdminIncludeInactiveCustomers] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');
  const [showChangePhoneModal, setShowChangePhoneModal] = useState(false);
  const [changePhoneCurrentOtp, setChangePhoneCurrentOtp] = useState('');
  const [changePhoneNewNumber, setChangePhoneNewNumber] = useState('');
  const [changePhoneNewOtp, setChangePhoneNewOtp] = useState('');
  const [showPointsCreditModal, setShowPointsCreditModal] = useState(false);
  const [pointsCreditAmount, setPointsCreditAmount] = useState('');
  const [pointsCreditReason, setPointsCreditReason] = useState('');

  const [adminStockists, setAdminStockists] = useState([]);
  const [adminIncludeInactiveStockists, setAdminIncludeInactiveStockists] = useState(false);
  const [selectedStockistDetail, setSelectedStockistDetail] = useState(null);
  const [showCreateStockistModal, setShowCreateStockistModal] = useState(false);
  const [createStkName, setCreateStkName] = useState('');
  const [createStkRegion, setCreateStkRegion] = useState('');
  const [createStkVendor, setCreateStkVendor] = useState('v1');
  const [createStkPhone, setCreateStkPhone] = useState('');
  const [createStkRadius, setCreateStkRadius] = useState('3.0');
  const [createStkOpen, setCreateStkOpen] = useState('08:00');
  const [createStkClose, setCreateStkClose] = useState('20:00');
  const [createStkEta, setCreateStkEta] = useState('15');
  const [createStkRate, setCreateStkRate] = useState('10.0');
  const [showEditStockistModal, setShowEditStockistModal] = useState(false);
  const [editStkName, setEditStkName] = useState('');
  const [editStkAddress, setEditStkAddress] = useState('');
  const [editStkOpen, setEditStkOpen] = useState('08:00');
  const [editStkClose, setEditStkClose] = useState('20:00');
  const [editStkEta, setEditStkEta] = useState('15');
  const [editStkRadius, setEditStkRadius] = useState('3.0');
  const [showCommissionRateModal, setShowCommissionRateModal] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState('');
  const [commissionRatePreview, setCommissionRatePreview] = useState(null);
  const [commissionTypedConfirm, setCommissionTypedConfirm] = useState('');
  const [showStockistRegionModal, setShowStockistRegionModal] = useState(false);
  const [newStockistRegion, setNewStockistRegion] = useState('r1');
  const [stockistBindingsCount, setStockistBindingsCount] = useState(0);

  // Admin Region Management State (BF5b)
  const [adminRegionsList, setAdminRegionsList] = useState([]);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [regionName, setRegionName] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [regionCodeUserEdited, setRegionCodeUserEdited] = useState(false);
  const [regionModalError, setRegionModalError] = useState('');
  const [shopSearchQuery, setShopSearchQuery] = useState('');

  const [partnerLeads, setPartnerLeads] = useState([]);
  const [leadStatusFilter, setLeadStatusFilter] = useState('ALL');
  const [selectedLeadDetail, setSelectedLeadDetail] = useState(null);
  const [showAddLeadNoteModal, setShowAddLeadNoteModal] = useState(false);
  const [newLeadNoteText, setNewLeadNoteText] = useState('');

  // Round P2 State
  const [healthData, setHealthData] = useState(null);
  const [adminPartners, setAdminPartners] = useState([]);
  const [partnerSubTab, setPartnerSubTab] = useState('leads');
  const [partnerRegionFilter, setPartnerRegionFilter] = useState('ALL');
  const [partnerServiceFilter, setPartnerServiceFilter] = useState('ALL');
  const [partnerActiveFilter, setPartnerActiveFilter] = useState('ALL');
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState(null);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [editPartnerLegalName, setEditPartnerLegalName] = useState('');
  const [editPartnerDisplayName, setEditPartnerDisplayName] = useState('');
  const [editPartnerPhone, setEditPartnerPhone] = useState('');
  const [editPartnerEmail, setEditPartnerEmail] = useState('');
  const [editPartnerAddress, setEditPartnerAddress] = useState('');
  const [editPartnerGst, setEditPartnerGst] = useState('');

  const [showPromoteLeadModal, setShowPromoteLeadModal] = useState(false);
  const [selectedLeadToPromote, setSelectedLeadToPromote] = useState(null);
  const [promoteDisplayName, setPromoteDisplayName] = useState('');
  const [promoteServiceTypes, setPromoteServiceTypes] = useState(['CABLE']);

  const [adminRedemptionApprovals, setAdminRedemptionApprovals] = useState([]);
  const [redemptionApprovalSubTab, setRedemptionApprovalSubTab] = useState('pending');
  const [showApproveRedemptionModal, setShowApproveRedemptionModal] = useState(false);
  const [selectedRedemptionToApprove, setSelectedRedemptionToApprove] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [showRejectRedemptionModal, setShowRejectRedemptionModal] = useState(false);
  const [selectedRedemptionToReject, setSelectedRedemptionToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showResolveDisputeModal, setShowResolveDisputeModal] = useState(false);
  const [selectedRedemptionToResolve, setSelectedRedemptionToResolve] = useState(null);
  const [resolveOutcome, setResolveOutcome] = useState('fulfill');
  const [resolveNotes, setResolveNotes] = useState('');
  const [selectedRedemptionDetail, setSelectedRedemptionDetail] = useState(null);
  const [fulfilledSearchText, setFulfilledSearchText] = useState('');

  const [adminFraudReports, setAdminFraudReports] = useState([]);
  const [fraudReportTab, setFraudReportTab] = useState('NEW');
  const [selectedFraudReportDetail, setSelectedFraudReportDetail] = useState(null);
  const [fraudReportAdminNotes, setFraudReportAdminNotes] = useState('');

  const [adminAuditLogs, setAdminAuditLogs] = useState([]);
  const [auditFilterAdmin, setAuditFilterAdmin] = useState('');
  const [auditFilterEntityType, setAuditFilterEntityType] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState('');

  const [activeFulfillmentOrder, setActiveFulfillmentOrder] = useState(null);
  const [selectedPickupSlot, setSelectedPickupSlot] = useState(null);
  const [allStockistCommissionRates, setAllStockistCommissionRates] = useState([]);
  const [allPointsEarnConfigs, setAllPointsEarnConfigs] = useState([]);
  const [allFeedbackReports, setAllFeedbackReports] = useState([]);
  const [submittingFeedbackOrder, setSubmittingFeedbackOrder] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [reportFlag, setReportFlag] = useState(false);

  // Slot picker state (compulsory before checkout)
  const [cartPickupSlots, setCartPickupSlots] = useState({}); // stockistId -> slot
  const [slotError, setSlotError] = useState(false);

  // No-show alert state
  const [noShowAlert, setNoShowAlert] = useState(null); // { orderId, canReschedule }
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  // One-way delivery switch confirmation
  const [deliverySwitchConfirm, setDeliverySwitchConfirm] = useState(null); // orderId

  // Admin: anomaly dismiss reason
  const [dismissReason, setDismissReason] = useState({});

  // Admin: payment ledger / transactions
  const [adminPaymentLedger, setAdminPaymentLedger] = useState([]);
  const [adminCodCommission, setAdminCodCommission] = useState([]);

  // Customer signup flow (separate from stockist signup)
  const [showCustomerSignup, setShowCustomerSignup] = useState(false);
  const [showStockistSignup, setShowStockistSignup] = useState(false);
  const [regShopName, setRegShopName] = useState('');
  const [regKycType2, setRegKycType2] = useState('Aadhaar');
  const [regKycNumber2, setRegKycNumber2] = useState('');
  const [stockistPendingUser, setStockistPendingUser] = useState(null);

  // Round P3 — Customer Signup Partner Selection & Profile State
  const [signupCablePartnerId, setSignupCablePartnerId] = useState('');
  const [noCableProvider, setNoCableProvider] = useState(false);
  const [hasBroadbandAnswered, setHasBroadbandAnswered] = useState(false);
  const [hasBroadband, setHasBroadband] = useState(false);
  const [signupBroadbandPartnerId, setSignupBroadbandPartnerId] = useState('');
  const [noBroadbandProvider, setNoBroadbandProvider] = useState(false);
  const [signupReferralCode, setSignupReferralCode] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(false);
  const [availablePartners, setAvailablePartners] = useState({ cable: [], broadband: [] });

  const [profileName, setProfileName] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileCablePartnerId, setProfileCablePartnerId] = useState('');
  const [profileNoCable, setProfileNoCable] = useState(false);
  const [profileHasBroadband, setProfileHasBroadband] = useState(false);
  const [profileBroadbandPartnerId, setProfileBroadbandPartnerId] = useState('');
  const [profileNoBroadband, setProfileNoBroadband] = useState(false);
  const [profileAvailablePartners, setProfileAvailablePartners] = useState({ cable: [], broadband: [] });
  const [customerBindings, setCustomerBindings] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  
  // --- Round P4b Partner App State ---
  const [partnerAppTab, setPartnerAppTab] = useState('dashboard');
  const [partnerQueueSubTab, setPartnerQueueSubTab] = useState('to_fulfill');
  const [partnerData, setPartnerData] = useState(null);
  const [partnerSessionToken, setPartnerSessionToken] = useState(localStorage.getItem('fastnet_partner_session') || '');
  
  // Auth Form state
  const [showPartnerLogin, setShowPartnerLogin] = useState(false);
  const [partnerLoginTab, setPartnerLoginTab] = useState('password'); // 'password' or 'otp'
  const [partnerLoginEmail, setPartnerLoginEmail] = useState('');
  const [partnerLoginPassword, setPartnerLoginPassword] = useState('');
  const [partnerForgotEmail, setPartnerForgotEmail] = useState('');
  const [showPartnerForgotForm, setShowPartnerForgotForm] = useState(false);
  const [partnerLoginPhone, setPartnerLoginPhone] = useState('');
  const [partnerLoginOtp, setPartnerLoginOtp] = useState('');
  const [partnerOtpSent, setPartnerOtpSent] = useState(false);
  const [partnerResetToken, setPartnerResetToken] = useState('');
  const [partnerNewPasswordLanding, setPartnerNewPasswordLanding] = useState('');
  const [partnerConfirmPasswordLanding, setPartnerConfirmPasswordLanding] = useState('');

  // Dashboard Tab state
  const [partnerDashData, setPartnerDashData] = useState(null);
  
  // Queue Tab state
  const [partnerQueueList, setPartnerQueueList] = useState([]);
  const [partnerDisputesList, setPartnerDisputesList] = useState([]);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [selectedFulfillItem, setSelectedFulfillItem] = useState(null);
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedDisputeItem, setSelectedDisputeItem] = useState(null);
  const [disputeReasonText, setDisputeReasonText] = useState('');

  // Packages Tab state
  const [partnerPackagesList, setPartnerPackagesList] = useState([]);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgServiceType, setPkgServiceType] = useState('CABLE');
  const [pkgFaceValue, setPkgFaceValue] = useState('');
  const [pkgCostToPartner, setPkgCostToPartner] = useState('');
  const [pkgPointCost, setPkgPointCost] = useState('');
  const [pkgActiveRegions, setPkgActiveRegions] = useState([]);

  // Regions Tab state
  const [partnerRegionsList, setPartnerRegionsList] = useState([]);
  const [allSystemRegions, setAllSystemRegions] = useState([]);
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [newRegionId, setNewRegionId] = useState('r1');
  const [newRegionServiceType, setNewRegionServiceType] = useState('CABLE');
  const [deactWarnModal, setDeactWarnModal] = useState(false);
  const [deactWarnRowId, setDeactWarnRowId] = useState(null);
  const [deactWarnPackages, setDeactWarnPackages] = useState([]);

  // Feedback Tab state
  const [partnerFeedbackList, setPartnerFeedbackList] = useState([]);
  const [showNewFeedbackModal, setShowNewFeedbackModal] = useState(false);
  const [fbTypeRadio, setFbTypeRadio] = useState('GENERAL');
  const [fbRedemptionId, setFbRedemptionId] = useState('');
  const [fbFulfilledRedemptions, setFbFulfilledRedemptions] = useState([]);
  const [fbCategory, setFbCategory] = useState('GENERAL');
  const [fbSubject, setFbSubject] = useState('');
  const [fbDescription, setFbDescription] = useState('');
  const [showFeedbackDetailModal, setShowFeedbackDetailModal] = useState(false);
  const [selectedFeedbackDetail, setSelectedFeedbackDetail] = useState(null);

  // Profile Tab state
  const [pProfDisplayName, setPProfDisplayName] = useState('');
  const [pProfContactPhone, setPProfContactPhone] = useState('');
  const [pProfContactEmail, setPProfContactEmail] = useState('');
  const [pProfAddress, setPProfAddress] = useState('');
  const [confirmPhoneChangeCheck, setConfirmPhoneChangeCheck] = useState(false);
  const [initialContactPhone, setInitialContactPhone] = useState('');
  const [pProfCounts, setPProfCounts] = useState({ bound_customers: 0, redemptions_all_time: 0, disputes_open: 0 });
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [pProfCurrentPass, setPProfCurrentPass] = useState('');
  const [pProfNewPass, setPProfNewPass] = useState('');
  const [pProfConfirmNewPass, setPProfConfirmNewPass] = useState('');

  // Notifications
  const [partnerNotifList, setPartnerNotifList] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Rate config form (per-stockist overrides)
  const [selectedStockistForCommission, setSelectedStockistForCommission] = useState('');
  const [configStockistRate, setConfigStockistRate] = useState(10);
  
  // Points earn config form
  const [earnRateRegion, setEarnRateRegion] = useState('r1');
  const [earnRateStockist, setEarnRateStockist] = useState('');
  const [earnRatePercent, setEarnRatePercent] = useState(45);

  // Multi-vendor form
  const [vendorAdminStockistId, setVendorAdminStockistId] = useState('');
  const [vendorAdminVendorId, setVendorAdminVendorId] = useState('');

  // Stockist App State additions
  const [stockistApprovedVendors, setStockistApprovedVendors] = useState([]);
  const [selectedRestockVendorId, setSelectedRestockVendorId] = useState('');
  const [prepElapsedOrders, setPrepElapsedOrders] = useState([]);
  const [restockQuantities, setRestockQuantities] = useState({});
  const [enteredPins, setEnteredPins] = useState({});
  const [analyticsRange, setAnalyticsRange] = useState('weekly'); // weekly, monthly
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCostPrice, setNewProdCostPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('groceries');
  const [newProdInitialStock, setNewProdInitialStock] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('15');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCostPrice, setEditProdCostPrice] = useState('');

  // Round T Bill Photo State
  const [newProdBillFile, setNewProdBillFile] = useState(null);
  const [editProdBillFile, setEditProdBillFile] = useState(null);
  const [showBillHistoryModal, setShowBillHistoryModal] = useState(false);
  const [billHistoryProduct, setBillHistoryProduct] = useState(null);
  const [billHistoryData, setBillHistoryData] = useState([]);
  const [uploadedBillPreviewUrl, setUploadedBillPreviewUrl] = useState(null);

  // Admin Bill Photos Tab State
  const [adminBillPhotos, setAdminBillPhotos] = useState([]);
  const [billPhotoFlagFilter, setBillPhotoFlagFilter] = useState('ALL');
  const [billPhotoStockistFilter, setBillPhotoStockistFilter] = useState('ALL');
  const [billPhotoDateFrom, setBillPhotoDateFrom] = useState('');
  const [billPhotoDateTo, setBillPhotoDateTo] = useState('');
  const [showFlagBillModal, setShowFlagBillModal] = useState(false);
  const [flaggingBill, setFlaggingBill] = useState(null);
  const [flagReasonText, setFlagReasonText] = useState('');
  const [showUnflagBillModal, setShowUnflagBillModal] = useState(false);
  const [unflaggingBill, setUnflaggingBill] = useState(null);
  const [viewingBillModal, setViewingBillModal] = useState(null);
  const [customerProvenanceProduct, setCustomerProvenanceProduct] = useState(null);
  const [customerProvenanceHistory, setCustomerProvenanceHistory] = useState([]);
  const [billImgErrors, setBillImgErrors] = useState({});

  const formatBillDate = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  };

  const formatBillPrice = (val) => {
    if (val === undefined || val === null || val === '' || isNaN(Number(val))) return '—';
    return `₹${Number(val).toFixed(2)}`;
  };

  // Multi-lingual & Simulation States
  const [lang, setLang] = useState('en');
  const t = (en, hi, bn) => lang === 'hi' ? hi : lang === 'bn' ? bn : en;

  const [changingSlotOrderId, setChangingSlotOrderId] = useState(null);

  const [confirmModal, setConfirmModal] = useState(null);
  const [deliveredModalOrder, setDeliveredModalOrder] = useState(null);
  const [shownDeliveredIds, setShownDeliveredIds] = useState(new Set());
  const [deliveredRating, setDeliveredRating] = useState(5);
  const [deliveredComment, setDeliveredComment] = useState('');

  const handleDeliveredSubmitReview = async () => {
    if (!deliveredModalOrder) return;
    try {
      const payload = {
        reporterRole: 'CUSTOMER',
        reporterId: currentUser?.id || deliveredModalOrder.customer_id,
        reporterName: currentUser?.name || 'Customer',
        targetRole: 'STOCKIST',
        targetId: deliveredModalOrder.stockist_id,
        targetName: deliveredModalOrder.stockist_name || 'Stockist',
        orderId: deliveredModalOrder.id,
        rating: deliveredRating,
        reason: deliveredComment,
        reportFlag: false
      };
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/feedback', payload, res.status, data);
      if (res.ok) {
        showToast(t('Review submitted!', 'समीक्षा प्रस्तुत की गई!', 'পর্যালোচনা জমা দেওয়া হয়েছে!'));
        loadCustomerData();
        fetchDbState();
      }
    } catch (err) {
      showToast('Network error submitting feedback', 'error');
    }
    setDeliveredModalOrder(null);
    setDeliveredRating(5);
    setDeliveredComment('');
  };

  const handleDeliveredSkipReview = () => {
    setDeliveredModalOrder(null);
    setDeliveredRating(5);
    setDeliveredComment('');
  };

  useEffect(() => {
    if (!dbState?.orders || !currentUser?.id) return;
    const myDelivered = dbState.orders.filter(
      o => o.customer_id === currentUser.id && o.status === 'DELIVERED'
    );
    for (const ord of myDelivered) {
      if (!shownDeliveredIds.has(ord.id)) {
        setShownDeliveredIds(prev => new Set([...prev, ord.id]));
        setDeliveredModalOrder(ord);
        break;
      }
    }
  }, [dbState?.orders, currentUser?.id]);
  const triggerConfirmModal = (title, message, onConfirm, danger, yesLabel, noLabel) => {
    setConfirmModal({ title, message, onConfirm, danger, yesLabel, noLabel });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setConfirmModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatHour12 = (h) => {
    if (typeof h === 'string' && h.includes(':')) {
      h = parseInt(h.split(':')[0], 10);
    } else if (typeof h === 'string') {
      h = parseInt(h, 10);
    }
    if (isNaN(h)) return '';
    const normalizedHour = h % 24;
    const period = normalizedHour >= 12 ? 'PM' : 'AM';
    const displayHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
    return `${displayHour}:00 ${period}`;
  };

  const formatPickupSlotDisplay = (slotStr) => {
    if (!slotStr) return '';
    const match = slotStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/);
    if (match) {
      const [, dateStr, hStr] = match;
      const h = parseInt(hStr, 10);
      const startFmt = formatHour12(h);
      const endFmt = formatHour12(h + 1);
      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = dateStr === todayStr;
      const prefix = isToday ? 'Today' : dateStr;
      return `${prefix}, ${startFmt} – ${endFmt}`;
    }
    return slotStr;
  };

  const getAvailableSlots = (stockist, now = new Date()) => {
    if (!stockist) return [];
    const opening = stockist.opening_time || '08:00';
    const closing = stockist.closing_time || '20:00';
    const prepMinutes = stockist.prep_eta_minutes || 10;

    const [opH] = opening.split(':').map(Number);
    const [clH] = closing.split(':').map(Number);

    const minTime = new Date(now.getTime() + prepMinutes * 60 * 1000);

    const slots = [];
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Try today's slots first
    for (let h = opH; h < clH; h++) {
      const slotStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), h, 0, 0);
      if (slotStart.getTime() >= minTime.getTime()) {
        const year = todayDate.getFullYear();
        const month = String(todayDate.getMonth() + 1).padStart(2, '0');
        const day = String(todayDate.getDate()).padStart(2, '0');
        const hourStr = String(h).padStart(2, '0');
        
        const value = `${year}-${month}-${day}T${hourStr}:00`;
        const label = `Today, ${formatHour12(h)} – ${formatHour12(h + 1)}`;
        slots.push({ value, label, day: 'today' });
      }
    }

    // If no slots remain today (or less than 8), fill with tomorrow's slots
    if (slots.length === 0) {
      const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
      const year = tomorrowDate.getFullYear();
      const month = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrowDate.getDate()).padStart(2, '0');

      for (let h = opH; h < clH; h++) {
        const hourStr = String(h).padStart(2, '0');
        const value = `${year}-${month}-${day}T${hourStr}:00`;
        const label = `Tomorrow, ${formatHour12(h)} – ${formatHour12(h + 1)}`;
        slots.push({ value, label, day: 'tomorrow' });
        if (slots.length >= 8) break;
      }
    }

    // Fallback: Always return at least one slot
    if (slots.length === 0) {
      const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
      const year = tomorrowDate.getFullYear();
      const month = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrowDate.getDate()).padStart(2, '0');
      const hourStr = String(opH).padStart(2, '0');
      const value = `${year}-${month}-${day}T${hourStr}:00`;
      const label = `Tomorrow, ${formatHour12(opH)} – ${formatHour12(opH + 1)}`;
      slots.push({ value, label, day: 'tomorrow' });
    }

    return slots.slice(0, 8);
  };
  const [productSearch, setProductSearch] = useState('');
  const [stockistProductSearch, setStockistProductSearch] = useState('');
  const [fulfillmentPreference, setFulfillmentPreference] = useState('PICKUP');
  const [expandedBreakdownOrders, setExpandedBreakdownOrders] = useState(new Set());
  const toggleBreakdown = (orderId) => {
    setExpandedBreakdownOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
      return next;
    });
  };
  const [stockistAnalytics, setStockistAnalytics] = useState(null);
  const [stockistActiveTab, setStockistActiveTab] = useState('orders'); // orders | analytics | inventory

  // Stockist App State
  const [stockistProfile, setStockistProfile] = useState(null);
  const [stockistOrders, setStockistOrders] = useState([]);
  const [stockistProducts, setStockistProducts] = useState([]);
  const [offlineMode, setOfflineMode] = useState(() => {
    return localStorage.getItem('fastnet_offline_mode') === 'true';
  });
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('fastnet_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('fastnet_offline_mode', offlineMode.toString());
  }, [offlineMode]);

  useEffect(() => {
    localStorage.setItem('fastnet_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Admin Dashboard State
  const [pendingKyc, setPendingKyc] = useState([]);
  const [commissionRates, setCommissionRates] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [pendingRedemptions, setPendingRedemptions] = useState([]);
  const [adminNewVendor, setAdminNewVendor] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  
  // Commission Config (Profit-basis v2) State
  const [commissionConfigs, setCommissionConfigs] = useState([]);
  const [globalReinvestPct, setGlobalReinvestPct] = useState(50);
  const [globalPointsPct, setGlobalPointsPct] = useState(40);
  const [globalCutPct, setGlobalCutPct] = useState(12);

  const [showStoreOverrideModal, setShowStoreOverrideModal] = useState(false);
  const [overrideStockistId, setOverrideStockistId] = useState('');
  const [overrideReinvestPct, setOverrideReinvestPct] = useState(50);
  const [overridePointsPct, setOverridePointsPct] = useState(40);
  const [overrideCutPct, setOverrideCutPct] = useState(12);

  const [showRemoveOverrideConfirmModal, setShowRemoveOverrideConfirmModal] = useState(false);
  const [overrideToDelete, setOverrideToDelete] = useState(null);
  
  // Rate config form
  const [configCategory, setConfigCategory] = useState('groceries');
  const [configRate, setConfigRate] = useState(10);
  const [configRegion, setConfigRegion] = useState('r1');

  // Simulator Shell State
  const [dbTab, setDbTab] = useState('points_ledger');
  const [apiLogs, setApiLogs] = useState([]);
  const [toast, setToast] = useState(null);

  // Auth fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [regName, setRegName] = useState('');
  const [regRegion, setRegRegion] = useState('');
  const [regKycType, setRegKycType] = useState('Aadhaar');
  const [regKycNumber, setRegKycNumber] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regIsStockist, setRegIsStockist] = useState(false);

  // Marketing Calculator State
  const [calcCustomers, setCalcCustomers] = useState(25000);
  const [calcBill, setCalcBill] = useState(700);
  const [calcMarketplace, setCalcMarketplace] = useState(1500);

  // Sync log helper
  const logApi = (method, url, payload, status, response) => {
    setApiLogs(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        method,
        url,
        payload: payload ? JSON.stringify(payload) : null,
        status,
        response: JSON.stringify(response)
      },
      ...prev
    ].slice(0, 50));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatPoints = (value) => {
    const num = parseFloat(value) || 0;
    const formatted = num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
    return `${formatted} pts`;
  };

  const formatOrderStatusDisplay = (status, fulfillmentType) => {
    const isPickup = fulfillmentType === 'PICKUP';
    if (status === 'CONFIRMING') {
      return t('Received', 'प्राप्त', 'গৃহীত');
    }
    if (status === 'RECEIVED') {
      return t('Received', 'प्राप्त', 'গৃহীত');
    }
    if (status === 'READY') {
      return isPickup ? t('Ready for Pickup', 'पिकअप के लिए तैयार', 'পিকআপের জন্য প্রস্তুত') : t('Ready for Delivery', 'वितरण के लिए तैयार', 'ডেলিভারির জন্য প্রস্তুত');
    }
    if (status === 'DELIVERED') {
      return isPickup ? t('Picked Up', 'পিকআপ किया गया', 'পিকআপ সম্পন্ন') : t('Delivered', 'वितरित', 'ডেলিভারি সম্পন্ন');
    }
    if (status === 'CANCELLED') {
      return t('Cancelled', 'रद्द', 'বাতিল');
    }
    return status;
  };

    const renderCancelButtonOrClosed = (o) => {
    const isConfirming = o.status === 'CONFIRMING';
    const hasDeadline = !!o.cancel_deadline;
    const deadlineMs = hasDeadline ? new Date(o.cancel_deadline).getTime() : 0;
    const nowMs = nowTick;
    const isWithinWindow = isConfirming && hasDeadline && nowMs < deadlineMs;

    if (isWithinWindow) {
      const diffSecs = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      const mmss = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      const label = t(
        `Cancel Order \u2014 ${mmss} left`,
        `ऑर्डर रद्द करें \u2014 ${mmss} बचे हैं`,
        `অর্ডার বাতিল করুন \u2014 ${mmss} বাকি`
      );
      
      return (
        <button
          className="btn btn-danger"
          style={{ width: '100%', padding: '0.35rem', fontSize: '0.65rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
          onClick={() => triggerConfirmModal(
            t('Cancel Order', 'ऑर्डर रद्द करें', 'অর্ডার বাতিল করুন'),
            t('Are you sure you want to cancel this order? This action cannot be undone.', 'क्या आप वाकई इस ऑर्डर को रद्द करना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।', 'আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি বাতিল করতে চান? এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।'),
            () => handleCancelOrder(o.id),
            true,
            t('Yes, Cancel', 'हाँ, रद्द करें', 'হ্যাঁ, বাতিল করুন'),
            t('No, Keep', 'नहीं, रखें', 'না, রাখুন')
          )}
        >
          <Ban size={12} /> {label}
        </button>
      );
    } else if (o.status !== 'CANCELLED') {
      const closedText = t(
        'Cancellation window closed',
        'रद्दीकरण विंडो बंद हो गई है',
        'বাতিলের সময়সীমা শেষ হয়েছে'
      );
      return (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', marginTop: '0.2rem', textAlign: 'center', fontStyle: 'italic' }}>
          {closedText}
        </div>
      );
    }
    return null;
  };

  // ----------------------------------------------------
  // GUIDED WALKTHROUGH DEMO AUTOMATION
  // ----------------------------------------------------
  const handleAutoTourStep = async () => {
    try {
      if (tourStep === 1) {
        // Step 1: Log in customer and fill cart
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '9876543210', otp: '123456' })
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          setSelectedRegionId(data.user.region_id);
          setCustomerAppTab('store');
          setActiveRole('customer');
          
          const sRes = await fetch(`${API_BASE}/stockists?regionId=${data.user.region_id}`);
          const sData = await sRes.json();
          setCustomerStockists(sData);
          if (sData.length > 0) {
            setSelectedStockist(sData[0]);
            const pRes = await fetch(`${API_BASE}/products?regionId=${data.user.region_id}&stockistId=${sData[0].id}`);
            const pData = await pRes.json();
            setCustomerProducts(pData);
            
            // Auto add Potato x3 (₹90) + Onion x2 (₹90) + Dal x2 (₹120) = ₹300 (exceeds ₹200 min order)
            const pPotato = pData.find(p => p.id === 'p1') || pData[0];
            const pOnion = pData.find(p => p.id === 'p2') || pData[1] || pData[0];
            const pDal = pData.find(p => p.id === 'p3') || pData[2] || pData[0];
            
            setCustomerCart([
              { product: pPotato, quantity: 3, stockistId: sData[0].id, stockistName: sData[0].name },
              { product: pOnion, quantity: 2, stockistId: sData[0].id, stockistName: sData[0].name },
              { product: pDal, quantity: 2, stockistId: sData[0].id, stockistName: sData[0].name }
            ]);
            showToast("Demo basket filled! Press 'Place Order (অর্ডার করুন)' on the phone.", "info");
          }
        }
      } else if (tourStep === 2) {
        // Step 2: Log in stockist, find the Amit Sen order, and deliver it
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '7654321098', otp: '123456' })
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          setSelectedRegionId(data.user.region_id);
          setActiveRole('stockist');
          
          const pRes = await fetch(`${API_BASE}/stockists/by-user/${data.user.id}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            setStockistProfile(pData);
            const oRes = await fetch(`${API_BASE}/orders?stockistId=${pData.id}`);
            const oData = await oRes.json();
            setStockistOrders(oData);
            
            // Cycle latest order straight to DELIVERED
            const pendingOrder = oData.find(o => ['CONFIRMING', 'RECEIVED', 'READY'].includes(o.status));
            if (pendingOrder) {
              await fetch(`${API_BASE}/orders/${pendingOrder.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DELIVERED' })
              });
              showToast("Accepted & delivered! Payment has been split.", "success");
              // Reload
              const oRes2 = await fetch(`${API_BASE}/orders?stockistId=${pData.id}`);
              const oData2 = await oRes2.json();
              setStockistOrders(oData2);
            }
          }
          setTourStep(3);
        }
      } else if (tourStep === 3) {
        // Step 3: Switch to Customer Points tab, fill redemption
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '9876543210', otp: '123456' })
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          setSelectedRegionId(data.user.region_id);
          setCustomerAppTab('ledger');
          setActiveRole('customer');
          
          const bRes = await fetch(`${API_BASE}/ledger/balance/${data.user.id}`);
          const bData = await bRes.json();
          setCustomerBalance(bData.balance);
          
          const redeemValue = bData.balance > 0 ? bData.balance : 45.00;
          setRedeemAmount(redeemValue.toString());
          showToast(`Points ready: ₹${redeemValue}. Click 'Redeem Bill Discount (রিডিম করুন)' to drop the bill!`, "info");
        }
      } else if (tourStep === 4) {
        // Step 4: Log in Admin, find redemption discount log, mark synced
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '9999999999', otp: '123456' })
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          setSelectedRegionId(data.user.region_id);
          setActiveRole('admin');
          setAdminTab('redemptions');
          
          const redRes = await fetch(`${API_BASE}/admin/redemptions`);
          const red = await redRes.json();
          setPendingRedemptions(red);
          
          const pendingRed = red.find(r => r.billing_sync_status !== 'SYNCED');
          if (pendingRed) {
            await fetch(`${API_BASE}/admin/complete-redemption`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ledgerId: pendingRed.id })
            });
            showToast("Bill discount synchronized with CRM Billing System!", "success");
            const redRes2 = await fetch(`${API_BASE}/admin/redemptions`);
            const red2 = await redRes2.json();
            setPendingRedemptions(red2);
          }
          setTourCompleted(true);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Verification sync issue. Is the backend running?", "error");
    }
  };

  const performReset = async (askConfirm = false) => {
    try {
      const res = await fetch(`${API_BASE}/admin/reset-db`, { method: 'POST' });
      if (res.ok) {
        setCurrentUser(null);
        setCustomerCart([]);
        setRedeemAmount('');
        setDiscountApplied(0);
        setTourStep(1);
        setTourCompleted(false);
        setOfflineQueue([]);
        setOfflineMode(false);
        localStorage.removeItem('fastnet_offline_queue');
        localStorage.removeItem('fastnet_offline_mode');
        setActiveRole('marketing');
        fetchDbState();
        showToast('Demo data and database reset to clean defaults!', 'success');
      } else {
        showToast('Reset failed', 'error');
      }
    } catch (err) {
      showToast('Reset failed. Check server status.', 'error');
    }
  };

  const handleResetTour = () => performReset(false);

  const switchViewToRole = async (targetRole) => {
    setActiveRole(targetRole);
    if (!isDevMode) {
      if (!currentUser || (
        (targetRole === 'customer' && currentUser.role !== 'CUSTOMER') ||
        (targetRole === 'stockist' && currentUser.role !== 'STOCKIST') ||
        (targetRole === 'admin' && currentUser.role !== 'ADMIN') ||
        (targetRole === 'partner' && currentUser.role !== 'PARTNER_ADMIN')
      )) {
        setCurrentUser(null);
      }
      return;
    }
    try {
      if (targetRole === 'customer' && (!currentUser || currentUser.role !== 'CUSTOMER')) {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '9830012345', otp: '123456' })
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          setSelectedRegionId(data.user.region_id);
        }
      } else if (targetRole === 'stockist' && (!currentUser || currentUser.role !== 'STOCKIST')) {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '7654321098', otp: '123456' })
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          setSelectedRegionId(data.user.region_id);
        }
      } else if (targetRole === 'admin' && (!currentUser || currentUser.role !== 'ADMIN')) {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '9999999999', otp: '123456' })
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          setSelectedRegionId(data.user.region_id);
        }
      } else if (targetRole === 'partner' && (!currentUser || currentUser.role !== 'PARTNER_ADMIN')) {
        const res = await fetch(`${API_BASE}/partner/auth/login-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'adhya@partners.example', password: 'password123' })
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser({ id: data.partner.id, name: data.partner.name, role: 'PARTNER_ADMIN' });
          setPartnerSessionToken(data.token);
          setPartnerData(data.partner);
        }
      }
    } catch (err) {
      console.error('Error switching view role session:', err);
    }
  };

  const renderTourBanner = () => {
    const stepsInfo = {
      1: {
        title: "Step 1: Place Grocery Order (ক্রেতা বাজার করুন)",
        desc: "Role: Customer App. Put fresh groceries in the cart, pick your pickup slot or delivery preference, and checkout. Loyalty points, based on item profit margins, credit when you collect your order.",
        actionBtn: "Auto-Fill basket",
        role: "customer"
      },
      2: {
        title: "Step 2: Shopkeeper Delivery (দোকানদার ডেলিভারি)",
        desc: "Role: Stockist App. Accept the order, verify fulfillment details, and mark it delivered. Check how the payment instantly splits: shopkeeper gets paid, platform keeps commission.",
        actionBtn: "Auto-Deliver Order",
        role: "stockist"
      },
      3: {
        title: "Step 3: Redeem Broadband Discount (পয়েন্টস রিডিম করুন)",
        desc: "Role: Customer App. Go to 'Points' tab, enter your points, and redeem them for WiFi booster packs or TV channel plans!",
        actionBtn: "Auto-Load points",
        role: "customer"
      },
      4: {
        title: "Step 4: Finalize Discount Sync (অ্যাডমিন সিঙ্ক)",
        desc: "Role: ISP Super Admin Portal. Under 'Broadband Discounts', approve and sync the discount log with the FastNet CRM billing software to close the loop.",
        actionBtn: "Auto-Sync with CRM",
        role: "admin"
      }
    };

    const step = stepsInfo[tourStep];
    if (tourCompleted) {
      return (
        <div className="walkthrough-banner" style={{ background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)', borderColor: 'var(--accent)' }}>
          <div className="walkthrough-steps">
            <div className="walkthrough-title" style={{ color: 'var(--accent)' }}>
              <span className="pulsing-dot" style={{ backgroundColor: 'var(--accent)' }}></span>
              <span>Closed-Loop Tour Completed! (সফলভাবে সম্পন্ন হয়েছে)</span>
            </div>
            <div className="walkthrough-desc">
              You've proven the loop: Retail margins successfully subsidized the FastNet broadband bill. ISP churn falls, and stockist gets direct sales!
            </div>
          </div>
          <div className="walkthrough-actions">
            <button className="btn btn-accent" onClick={handleResetTour}>Restart Guided Tour</button>
          </div>
        </div>
      );
    }

    return (
      <div className="walkthrough-banner">
        <div className="walkthrough-steps">
          <div className="walkthrough-title">
            <span className="pulsing-dot"></span>
            <span>{step.title}</span>
          </div>
          <div className="walkthrough-desc">{step.desc}</div>
        </div>
        <div className="walkthrough-actions">
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.75rem', padding: '0.45rem 0.8rem', height: '32px' }}
            onClick={() => switchViewToRole(step.role)}
          >
            Switch View
          </button>
          <button className="btn" style={{ fontSize: '0.75rem', padding: '0.45rem 0.8rem', height: '32px' }} onClick={handleAutoTourStep}>
            {step.actionBtn}
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.75rem', padding: '0.45rem 0.8rem', height: '32px', border: '1px solid var(--danger)', color: 'var(--danger)' }} 
            onClick={() => performReset(true)}
          >
            Reset Demo Data
          </button>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION
  // ----------------------------------------------------

  const fetchDbState = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/kyc-queue`); // Just testing backend online
      if (res.ok) {
        const ordersRes = await fetch(`${API_BASE}/orders`);
        const kycRes = await fetch(`${API_BASE}/admin/kyc-queue`);
        const ratesRes = await fetch(`${API_BASE}/admin/commission-rates`);
        const anomaliesRes = await fetch(`${API_BASE}/admin/anomalies`);
        const redRes = await fetch(`${API_BASE}/admin/redemptions`);
        const vendorsRes = await fetch(`${API_BASE}/admin/vendors`);
        const prodRes = await fetch(`${API_BASE}/products`);
        
        // Fetch new configurations/feedback logs
        const scrRes = await fetch(`${API_BASE}/admin/stockist-commission-rates`);
        const pecRes = await fetch(`${API_BASE}/admin/points-earn-config`);
        const fbRes = await fetch(`${API_BASE}/admin/feedback`);
        const leadsRes = await fetch(`${API_BASE}/admin/partner-leads`);
        
        const orders = await ordersRes.json();
        const pendingKyc = await kycRes.json();
        const rates = await ratesRes.json();
        const anomalies = await anomaliesRes.json();
        const redemptions = await redRes.json();
        const vendorsList = await vendorsRes.json();
        const productsList = await prodRes.json();
        
        const stockistCommissionRates = await scrRes.json();
        const pointsEarnConfigs = await pecRes.json();
        const feedbackReports = await fbRes.json();
        const leads = await leadsRes.json();

        const custsRes = await fetch(`${API_BASE}/admin/customers?include_inactive=true`);
        const stksRes = await fetch(`${API_BASE}/admin/stockists?include_inactive=true`);
        const fraudRes = await fetch(`${API_BASE}/admin/fraud-reports`);
        const auditRes = await fetch(`${API_BASE}/admin/audit-log`);
        const ccRes = await fetch(`${API_BASE}/admin/commission-config`);
        const bpRes = await fetch(`${API_BASE}/admin/bill-photos`);

        if (custsRes.ok) setAdminCustomers(await custsRes.json());
        if (stksRes.ok) setAdminStockists(await stksRes.json());
        if (fraudRes.ok) setAdminFraudReports(await fraudRes.json());
        if (auditRes.ok) setAdminAuditLogs(await auditRes.json());
        if (bpRes.ok) {
          const bpData = await bpRes.json();
          setAdminBillPhotos(bpData.data || []);
        }
        if (ccRes.ok) {
          const ccData = await ccRes.json();
          setCommissionConfigs(ccData);
          const gRow = ccData.find(c => c.scope === 'GLOBAL');
          if (gRow) {
            setGlobalReinvestPct(gRow.stockist_reinvest_pct);
            setGlobalPointsPct(gRow.points_from_pot_pct);
            setGlobalCutPct(gRow.partner_redemption_cut_pct);
          }
        }

        const partnersRes = await fetch(`${API_BASE}/admin/partners`);
        if (partnersRes.ok) setAdminPartners(await partnersRes.json());

        const approvalsRes = await fetch(`${API_BASE}/admin/redemption-approvals`);
        if (approvalsRes.ok) setAdminRedemptionApprovals(await approvalsRes.json());

        const healthRes = await fetch(`${API_BASE}/admin/health`);
        if (healthRes.ok) setHealthData(await healthRes.json());

        setPendingKyc(pendingKyc);
        setCommissionRates(rates);
        setAnomalies(anomalies);
        setPendingRedemptions(redemptions);
        setVendors(vendorsList);
        setPartnerLeads(leads);
        
        setAllStockistCommissionRates(stockistCommissionRates);
        setAllPointsEarnConfigs(pointsEarnConfigs);
        setAllFeedbackReports(feedbackReports);

        try {
          const regRes = await fetch(`${API_BASE}/regions`);
          if (regRes.ok) {
            const regData = await regRes.json();
            setRegions(regData);
            setAllSystemRegions(regData);
          }
        } catch (err) {
          console.error('Error fetching regions:', err);
        }

        // Mock state representation of tables for the inspector
        setDbState({
          users: [], // we will fetch user list or mock it
          orders,
          commission_rates: rates,
          anomaly_logs: anomalies,
          points_ledger: redemptions, // we will enrich this
          products: productsList,
          vendors: vendorsList,
          stockist_commission_rates: stockistCommissionRates,
          points_earn_config: pointsEarnConfigs,
          feedback_reports: feedbackReports,
          partner_leads: leads
        });
      }
    } catch (e) {
      console.error('Failed to sync DB state:', e);
    }
  };

  const fetchAdminPartners = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/partners`);
      if (res.ok) setAdminPartners(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRedemptionApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/redemption-approvals`);
      if (res.ok) setAdminRedemptionApprovals(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHealthData = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/health`);
      if (res.ok) setHealthData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminRegions = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/regions`);
      if (res.ok) setAdminRegionsList(await res.json());
    } catch (e) {
      console.error('Error fetching admin regions:', e);
    }
  };

  const handleSaveAdminRegion = async () => {
    setRegionModalError('');
    if (!regionName.trim()) {
      setRegionModalError('Name is required');
      return;
    }
    if (!regionCode.trim()) {
      setRegionModalError('Code is required');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(regionCode.trim())) {
      setRegionModalError('Code must contain only lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      const url = editingRegion ? `${API_BASE}/admin/regions/${editingRegion.id}` : `${API_BASE}/admin/regions`;
      const method = editingRegion ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regionName.trim(), code: regionCode.trim(), admin_id: currentUser?.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setRegionModalError(data.error || 'Failed to save region');
        return;
      }
      setShowRegionModal(false);
      showToast(editingRegion ? 'Region updated successfully' : 'Region created successfully', 'success');
      fetchAdminRegions();
      fetchDbState();
    } catch (err) {
      setRegionModalError('Network error saving region');
    }
  };

  const handleDeleteAdminRegion = (region) => {
    triggerConfirmModal(
      'Delete Region',
      `Are you sure you want to delete region "${region.name}" (${region.code})?`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/regions/${region.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) {
            showToast(data.error || 'Failed to delete region', 'error');
            return;
          }
          showToast('Region deleted successfully', 'success');
          fetchAdminRegions();
          fetchDbState();
        } catch (err) {
          showToast('Error deleting region', 'error');
        }
      },
      true,
      'Delete',
      'Cancel'
    );
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(false);
    try {
      const res = await fetch(`${API_BASE}/admin/analytics`, {
        headers: { 'x-admin-id': 'u-admin' }
      });
      const data = await res.json();
      if (res.ok) {
        setAnalyticsData(data);
      } else {
        setAnalyticsError(true);
      }
      logApi('GET', '/admin/analytics', null, res.status, data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalyticsError(true);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const openPromoteLeadModal = (lead) => {
    setSelectedLeadToPromote(lead);
    setPromoteDisplayName(lead.name || lead.business_name || '');
    setPromoteServiceTypes([lead.service_type || 'CABLE']);
    setShowPromoteLeadModal(true);
  };

  const handlePromoteLeadSubmit = async () => {
    if (!selectedLeadToPromote) return;
    if (!promoteDisplayName.trim()) {
      showToast('Display name is required', 'error');
      return;
    }
    if (!promoteServiceTypes || promoteServiceTypes.length === 0) {
      showToast('At least one service type is required', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/partner-leads/${selectedLeadToPromote.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser?.id || 'u-admin',
          service_types: promoteServiceTypes
        })
      });
      const data = await res.json();
      logApi('POST', `/admin/partner-leads/${selectedLeadToPromote.id}/promote`, { admin_id: 'u-admin', service_types: promoteServiceTypes }, res.status, data);
      if (res.ok) {
        showToast('Lead promoted to partner successfully!');
        setShowPromoteLeadModal(false);
        fetchDbState();
        fetchAdminPartners();
      } else {
        showToast(data.error || 'Failed to promote lead', 'error');
      }
    } catch (err) {
      showToast('Network error promoting lead', 'error');
    }
  };

  const handleApproveRedemption = async (id, notes) => {
    try {
      const res = await fetch(`${API_BASE}/admin/redemption-approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser?.id || 'u-admin',
          notes
        })
      });
      const data = await res.json();
      logApi('POST', `/admin/redemption-approvals/${id}/approve`, { admin_id: 'u-admin', notes }, res.status, data);
      if (res.ok) {
        showToast('Redemption approval approved successfully');
        setShowApproveRedemptionModal(false);
        fetchRedemptionApprovals();
      } else {
        showToast(data.error || 'Failed to approve redemption', 'error');
      }
    } catch (err) {
      showToast('Network error approving redemption', 'error');
    }
  };

  const handleRejectRedemption = async (id, reason) => {
    if (!reason || reason.trim().length < 10) {
      showToast('Reason must be at least 10 characters long', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/redemption-approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser?.id || 'u-admin',
          reason: reason.trim()
        })
      });
      const data = await res.json();
      logApi('POST', `/admin/redemption-approvals/${id}/reject`, { admin_id: 'u-admin', reason }, res.status, data);
      if (res.ok) {
        showToast(`Refund of ${data.points_deducted} points appended to customer's ledger`);
        setShowRejectRedemptionModal(false);
        fetchRedemptionApprovals();
      } else {
        showToast(data.error || 'Failed to reject redemption', 'error');
      }
    } catch (err) {
      showToast('Network error rejecting redemption', 'error');
    }
  };

  const handleResolveDispute = async (id, outcome, notes) => {
    try {
      const res = await fetch(`${API_BASE}/admin/redemption-approvals/${id}/resolve-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser?.id || 'u-admin',
          outcome,
          notes
        })
      });
      const data = await res.json();
      logApi('POST', `/admin/redemption-approvals/${id}/resolve-dispute`, { admin_id: 'u-admin', outcome, notes }, res.status, data);
      if (res.ok) {
        showToast(outcome === 'fulfill' ? 'Dispute resolved: FULFILLED' : 'Dispute resolved: REJECTED (Points refunded)');
        setShowResolveDisputeModal(false);
        fetchRedemptionApprovals();
      } else {
        showToast(data.error || 'Failed to resolve dispute', 'error');
      }
    } catch (err) {
      showToast('Network error resolving dispute', 'error');
    }
  };

  const handleSaveGlobalConfig = async () => {
    const reinvest = parseFloat(globalReinvestPct);
    const points = parseFloat(globalPointsPct);
    const cut = parseFloat(globalCutPct);
    if (isNaN(reinvest) || reinvest < 0 || reinvest > 100 ||
        isNaN(points) || points < 0 || points > 100 ||
        isNaN(cut) || cut < 0 || cut > 100) {
      showToast('Values must be valid numbers between 0 and 100', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/commission-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'GLOBAL',
          stockist_reinvest_pct: reinvest,
          points_from_pot_pct: points,
          partner_redemption_cut_pct: cut
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Global commission config saved!');
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to save global config', 'error');
      }
    } catch (err) {
      showToast('Network error saving global config', 'error');
    }
  };

  const handleSaveStoreOverride = async () => {
    if (!overrideStockistId) {
      showToast('Select a stockist first', 'error');
      return;
    }
    const reinvest = parseFloat(overrideReinvestPct);
    const points = parseFloat(overridePointsPct);
    const cut = parseFloat(overrideCutPct);
    if (isNaN(reinvest) || reinvest < 0 || reinvest > 100 ||
        isNaN(points) || points < 0 || points > 100 ||
        isNaN(cut) || cut < 0 || cut > 100) {
      showToast('Values must be valid numbers between 0 and 100', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/commission-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'STORE',
          stockist_id: overrideStockistId,
          stockist_reinvest_pct: reinvest,
          points_from_pot_pct: points,
          partner_redemption_cut_pct: cut
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Store commission override saved!');
        setShowStoreOverrideModal(false);
        setOverrideStockistId('');
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to save store override', 'error');
      }
    } catch (err) {
      showToast('Network error saving store override', 'error');
    }
  };

  const handleRemoveStoreOverride = async (configId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/commission-config/${configId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Store override removed!');
        setShowRemoveOverrideConfirmModal(false);
        setOverrideToDelete(null);
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to remove store override', 'error');
      }
    } catch (err) {
      showToast('Network error removing store override', 'error');
    }
  };

  // Sync DB Inspector tables directly
  

  const fetchAdminBillPhotos = async () => {
    try {
      let query = `${API_BASE}/admin/bill-photos?`;
      if (billPhotoFlagFilter !== 'ALL') query += `flag_status=${billPhotoFlagFilter}&`;
      if (billPhotoStockistFilter !== 'ALL') query += `stockist_id=${billPhotoStockistFilter}&`;
      if (billPhotoDateFrom) query += `date_from=${billPhotoDateFrom}&`;
      if (billPhotoDateTo) query += `date_to=${billPhotoDateTo}&`;

      const res = await fetch(query);
      if (res.ok) {
        const data = await res.json();
        setAdminBillPhotos(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin bill photos:', err);
    }
  };

  const syncInspectorTable = async () => {
    try {
      const ordersRes = await fetch(`${API_BASE}/orders`);
      const list = await ordersRes.json();
      
      const ratesRes = await fetch(`${API_BASE}/admin/commission-rates`);
      const rates = await ratesRes.json();

      const anomaliesRes = await fetch(`${API_BASE}/admin/anomalies`);
      const anomalies = await anomaliesRes.json();

      const redRes = await fetch(`${API_BASE}/admin/redemptions`);
      const red = await redRes.json();

      const prodRes = await fetch(`${API_BASE}/products?regionId=${selectedRegionId}`);
      const prods = await prodRes.json();

      const venRes = await fetch(`${API_BASE}/admin/vendors`);
      const vens = await venRes.json();

      const scrRes = await fetch(`${API_BASE}/admin/stockist-commission-rates`);
      const scrs = await scrRes.json();

      const pecRes = await fetch(`${API_BASE}/admin/points-earn-config`);
      const pecs = await pecRes.json();

      const fbRes = await fetch(`${API_BASE}/admin/feedback`);
      const fbs = await fbRes.json();

      const leadsRes = await fetch(`${API_BASE}/admin/partner-leads`);
      const leads = await leadsRes.json();

      setDbState({
        orders: list,
        commission_rates: rates,
        anomaly_logs: anomalies,
        points_ledger: red,
        products: prods,
        vendors: vens,
        stockist_commission_rates: scrs,
        points_earn_config: pecs,
        feedback_reports: fbs,
        partner_leads: leads
      });
    } catch (err) {
      console.log('Error syncing inspector:', err);
    }
  };

  useEffect(() => {
    fetchDbState();
    const interval = setInterval(fetchDbState, 8000);
    return () => clearInterval(interval);
  }, [selectedRegionId]);

  // Partner Session Hydration on Mount & Reset Query Token Parse
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('partner_reset');
    if (resetToken) {
      setPartnerResetToken(resetToken);
      setShowPartnerLogin(true);
    }

    const savedPartnerToken = localStorage.getItem('fastnet_partner_session');
    if (savedPartnerToken) {
      fetch(`${API_BASE}/partner/auth/session`, {
        headers: { Authorization: `Bearer ${savedPartnerToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(data => {
        if (data.user && data.partner) {
          setCurrentUser(data.user);
          setPartnerData(data.partner);
          setActiveRole('partner');
          setPartnerSessionToken(savedPartnerToken);
          loadPartnerAppData(savedPartnerToken);
        } else {
          localStorage.removeItem('fastnet_partner_session');
        }
      })
      .catch(() => {
        localStorage.removeItem('fastnet_partner_session');
      });
    }
  }, []);

  // Handle active role triggers
  useEffect(() => {
    if (!showDevSettings && activeRole === 'db') {
      setActiveRole('marketing');
      return;
    }
    if (currentUser && currentUser.role === 'CUSTOMER') {
      loadCustomerData();
    } else if (currentUser && currentUser.role === 'STOCKIST') {
      loadStockistData();
    } else if (currentUser && currentUser.role === 'PARTNER_ADMIN') {
      loadPartnerAppData();
    }
    if (activeRole === 'admin') {
      fetchAnalytics();
      fetchAdminRegions();
    }
    syncInspectorTable();
  }, [currentUser, activeRole, showDevSettings]);

  // Partner Notifications Polling (every 30s & on tab switch)
  useEffect(() => {
    if (currentUser?.role !== 'PARTNER_ADMIN' && activeRole !== 'partner') return;
    fetchPartnerNotifications();
    const interval = setInterval(() => {
      fetchPartnerNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser, activeRole, partnerAppTab]);

  // Live order status polling for customer (§A1)
  useEffect(() => {
    if (activeRole !== 'customer' || !currentUser || currentUser.role !== 'CUSTOMER') {
      return;
    }
    const pollInterval = setInterval(async () => {
      try {
        const oRes = await fetch(`${API_BASE}/orders?customerId=${currentUser.id}`);
        if (oRes.ok) {
          const oData = await oRes.json();
          setCustomerOrders(prev => {
            // Compare and Toast on changes
            oData.forEach(newO => {
              const oldO = prev.find(o => o.id === newO.id);
              if (oldO && oldO.status !== newO.status) {
                showToast(`Order #${newO.id.substring(2).toUpperCase()} status updated to ${newO.status}!`, 'info');
              }
            });
            return oData;
          });
        }
      } catch (err) {
        console.error('Error polling customer orders:', err);
      }
    }, 6000);
    return () => clearInterval(pollInterval);
  }, [currentUser, activeRole]);

  // ----------------------------------------------------
  // AUTH LOGIC
  // ----------------------------------------------------

  const handleSendOtp = async () => {
    if (!loginPhone) {
      showToast('Please enter a phone number', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone })
      });
      const data = await res.json();
      logApi('POST', '/auth/send-otp', { phone: loginPhone }, res.status, data);
      if (res.ok) {
        setOtpSent(true);
        showToast('OTP sent successfully! Enter 123456');
      } else {
        showToast(data.error || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      showToast('Backend connection error', 'error');
    }
  };

  const handleVerifyOtp = async () => {
    if (!loginOtp) {
      showToast('Please enter the OTP', 'error');
      return;
    }
    try {
      const payload = { phone: loginPhone, otp: loginOtp };
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/auth/verify-otp', payload, res.status, data);

      if (res.ok) {
        if (data.requires_registration) {
          showToast('Verification successful. Please register.');
        } else {
          setCurrentUser(data.user);
          setSelectedRegionId(data.user.region_id);
          showToast(`Welcome back, ${data.user.name}!`);
          setOtpSent(false);
          setLoginPhone('');
          setLoginOtp('');
        }
      } else {
        showToast(data.error || 'Invalid OTP', 'error');
      }
    } catch (err) {
      showToast('Authentication service error', 'error');
    }
  };

  const handleRegister = async () => {
    if (!regName) {
      showToast('Name is required', 'error');
      return;
    }
    try {
      let res, data;
      if (regIsStockist) {
        if (!regKycNumber || !regAddress) {
          showToast('KYC details and Address are required', 'error');
          return;
        }
        const payload = {
          phone: loginPhone,
          name: regName,
          regionId: regRegion,
          idType: regKycType,
          idNumber: regKycNumber,
          address: regAddress
        };
        res = await fetch(`${API_BASE}/auth/register-stockist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        logApi('POST', '/auth/register-stockist', payload, res.status, data);
      } else {
        const payload = {
          phone: loginPhone,
          otp: '123456',
          name: regName,
          regionId: regRegion
        };
        res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        logApi('POST', '/auth/verify-otp (Register)', payload, res.status, data);
      }

      if (res.ok) {
        if (regIsStockist) {
          showToast('KYC submitted! Awaiting Admin Approval.', 'warning');
          // Clear states
          setOtpSent(false);
          setRegName('');
          setRegKycNumber('');
          setRegAddress('');
        } else {
          setCurrentUser(data.user);
          setSelectedRegionId(data.user.region_id);
          showToast(`Account created for ${data.user.name}!`);
          setOtpSent(false);
          setRegName('');
        }
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (err) {
      showToast('Registration error', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCustomerStockists([]);
    setSelectedStockist(null);
    setPreviousStockistId(null);
    setCustomerProducts([]);
    setCustomerCart([]);
    setStockistProfile(null);
    setStockistOrders([]);
    showToast('Logged out successfully.');
  };

  // ----------------------------------------------------
  // CUSTOMER APP LOGIC
  // ----------------------------------------------------

  const loadCustomerData = async () => {
    if (!currentUser) return;
    try {
      // 1. Load stockists in customer region
      const sRes = await fetch(`${API_BASE}/stockists?regionId=${currentUser.region_id}`);
      const sData = await sRes.json();
      setCustomerStockists(sData);

      // 2. Load points balance
      const bRes = await fetch(`${API_BASE}/ledger/balance/${currentUser.id}`);
      const bData = await bRes.json();
      setCustomerBalance(bData.balance);

      // 3. Load ledger history
      const lRes = await fetch(`${API_BASE}/ledger/history/${currentUser.id}`);
      const lData = await lRes.json();
      setCustomerLedger(lData);

      // 4. Load order history
      const oRes = await fetch(`${API_BASE}/orders?customerId=${currentUser.id}`);
      const oData = await oRes.json();
      setCustomerOrders(oData);
    } catch (err) {
      console.error('Error loading customer data:', err);
    }
  };

  useEffect(() => {
    if (selectedStockist) {
      loadStockistProducts();
    }
  }, [selectedStockist]);

  const loadStockistProducts = async () => {
    if (!selectedStockist) return;
    try {
      const res = await fetch(`${API_BASE}/products?regionId=${currentUser.region_id}&stockistId=${selectedStockist.id}`);
      const data = await res.json();
      setCustomerProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const getPointsRate = (stockistId, regionId) => {
    const pecStockist = allPointsEarnConfigs.find(c => c.stockist_id === stockistId);
    if (pecStockist) return parseFloat(pecStockist.earn_rate_percent);
    const pecRegion = allPointsEarnConfigs.find(c => c.region_id === regionId && !c.stockist_id);
    if (pecRegion) return parseFloat(pecRegion.earn_rate_percent);
    return 45.0; // default fallback
  };

  const addToCart = (product) => {
    if (!selectedStockist) return;
    setCustomerCart(prev => {

      const existing = prev.find(item => item.product.id === product.id && item.stockistId === selectedStockist.id);
      if (existing) {
        return prev.map(item => 
          (item.product.id === product.id && item.stockistId === selectedStockist.id)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1, stockistId: selectedStockist.id, stockistName: selectedStockist.name }];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const updateCartQty = (productId, stockistId, change) => {
    setCustomerCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.stockistId === stockistId) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Calculated checkout metrics
  const cartSubtotal = customerCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartDeliveryFee = cartFulfillment === 'DELIVERY' ? (selectedStockist?.region_id === 'r2' ? 30.00 : 40.00) : 0.00;
  const cartTotal = cartSubtotal + cartDeliveryFee;
  const estimatedEarnPoints = Math.round(
    customerCart.reduce((sum, item) => {
      const itemMargin = (item.product.price - item.product.cost_price) * item.quantity;
      const rate = getPointsRate(item.stockistId, currentUser?.region_id || 'r1');
      return sum + (itemMargin * (rate / 100));
    }, 0) * 100
  ) / 100;

  const handleCheckout = async () => {
    if (customerCart.length === 0) return;

    // Group items by stockistId
    const groups = {};
    customerCart.forEach(item => {
      if (!groups[item.stockistId]) {
        groups[item.stockistId] = [];
      }
      groups[item.stockistId].push(item);
    });

    // §E13: pickup orders require slot per store
    if (cartFulfillment === 'PICKUP') {
      const missingSlot = Object.keys(groups).find(sid => !cartPickupSlots[sid]);
      if (missingSlot) {
        setSlotError(true);
        showToast(t('Please select a pickup time slot before placing order', 'कृपया ऑर्डर देने से पहले पिकअप समय स्लॉट चुनें', 'অর্ডার দেওয়ার আগে পিকআপ সময় স্লট নির্বাচন করুন'), 'error');
        return;
      }
    }
    setSlotError(false);

    try {
      // New multi-store format with slots
      const stores = Object.keys(groups).map(stockistId => ({
        stockistId,
        items: groups[stockistId].map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        pickupSlot: cartFulfillment === 'PICKUP' ? cartPickupSlots[stockistId] : null
      }));

      const payload = {
        customerId: currentUser.id,
        stores,
        fulfillmentType: cartFulfillment,
        paymentMethod: cartFulfillment === 'PICKUP' ? 'UPI' : 'COD'
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/orders', payload, res.status, data);

      if (res.ok) {
        const ordersPlaced = data.orders || [data.order];
        const totalPoints = data.totalPointsCredited || 0;
        setCheckoutResult({
          success: true,
          orders: ordersPlaced,
          totalPointsCredited: totalPoints
        });
        setCustomerCart([]);
        setCartPickupSlots({});
        loadCustomerData();
        const msg = cartFulfillment === 'PICKUP'
          ? t('Order placed! Payment held securely until pickup.', 'ऑर्डर दिया! पिकअप तक भुगतान सुरक्षित।', 'অর্ডার দেওয়া হয়েছে! পিকআপ পর্যন্ত পেমেন্ট নিরাপদ।')
          : t('Order placed! Cash on delivery.', 'ऑर्डर दिया! कैश ऑन डिलीवरी।', 'অর্ডার দেওয়া হয়েছে! ক্যাশ অন ডেলিভারি।');
        showToast(msg);
        if (tourStep === 1) setTourStep(2);
      } else {
        showToast(data.error || 'Failed to place order', 'error');
      }
    } catch (err) {
      showToast('Checkout service error', 'error');
    }
  };

  // §F16: Cancel order (only within cancel window)
  const handleCancelOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t('Order cancelled. Refund initiated (minus platform fee).', 'ऑर्डर रद्द। रिफंड शुरू (प्लेटफ़ॉर्म फीस घटाकर)।', 'অর্ডার বাতিল। ফেরত শুরু (প্ল্যাটফর্ম ফি বাদে)।'), 'success');
        loadCustomerData();
        if (checkoutResult) {
          setCheckoutResult(prev => ({ ...prev, orders: prev.orders.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o) }));
        }
      } else {
        showToast(data.error || 'Cancellation failed', 'error');
      }
    } catch (err) {
      showToast('Cancel request error', 'error');
    }
  };

  // §F19-20: No-show action
  const handleNoShowAction = async (orderId, action, slot = null) => {
    try {
      const body = { action };
      if (action === 'RESCHEDULE' && slot) body.newSlot = slot;
      const res = await fetch(`${API_BASE}/orders/${orderId}/noshw-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(action === 'RESCHEDULE'
          ? t('Slot rescheduled! One reschedule used.', 'स्लॉट पुनः निर्धारित!', 'স্লট পুনর্নির্ধারিত হয়েছে!')
          : t('Cancelled with refund. No-show recorded.', 'रिफंड के साथ रद्द।', 'রিফান্ডসহ বাতিল।'), action === 'RESCHEDULE' ? 'success' : 'warning');
        setNoShowAlert(null);
        setRescheduleSlot('');
        loadCustomerData();
      } else {
        showToast(data.error || 'Action failed', 'error');
      }
    } catch (err) {
      showToast('No-show action error', 'error');
    }
  };

  // §H: One-way delivery switch confirmed
  const handleSwitchToDeliveryConfirmed = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/fulfillment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillmentType: 'DELIVERY' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t('Switched to delivery! Cannot return to pickup.', 'डिलिवरी पर स्विच! वापस नहीं।', 'ডেলিভারিতে পরিবর্তিত। ফেরা সম্ভব নয়।'));
        if (checkoutResult) {
          setCheckoutResult(prev => ({ ...prev, orders: prev.orders.map(o => o.id === orderId ? data.order : o) }));
        }
        loadCustomerData();
      } else {
        showToast(data.error || 'Switch failed', 'error');
      }
      setDeliverySwitchConfirm(null);
    } catch (err) {
      showToast('Fulfillment service error', 'error');
      setDeliverySwitchConfirm(null);
    }
  };

  // §G25: Admin release split
  const handleReleaseSplit = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/release-split/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Split released! Stockist payout recorded.');
        fetchDbState();
      } else {
        showToast(data.error || 'Release failed', 'error');
      }
    } catch (err) {
      showToast('Release split error', 'error');
    }
  };

  const fetchAvailablePartners = async (regionId) => {
    if (!regionId) return;
    try {
      const res = await fetch(`${API_BASE}/customer/available-partners?region_id=${regionId}`);
      const data = await res.json();
      if (res.ok) {
        setAvailablePartners(data);
      }
    } catch (err) {
      console.error('Failed to fetch available partners', err);
    }
  };

  useEffect(() => {
    if (showCustomerSignup && regRegion) {
      fetchAvailablePartners(regRegion);
    }
  }, [showCustomerSignup, regRegion]);

  const fetchCustomerProfileData = async () => {
    if (!currentUser || currentUser.role !== 'CUSTOMER') return;
    try {
      const res = await fetch(`${API_BASE}/customer/${currentUser.id}/profile`);
      const data = await res.json();
      if (res.ok) {
        setProfileName(data.user?.name || '');
        setProfileAddress(data.user?.address || '');
        setCustomerBindings(data.bindings || null);
        setProfileAvailablePartners(data.available_partners || { cable: [], broadband: [] });

        if (data.bindings?.cable_partner_id) {
          setProfileCablePartnerId(data.bindings.cable_partner_id);
          setProfileNoCable(false);
        } else {
          setProfileCablePartnerId('');
          setProfileNoCable(true);
        }

        if (data.bindings?.broadband_partner_id) {
          setProfileHasBroadband(true);
          setProfileBroadbandPartnerId(data.bindings.broadband_partner_id);
          setProfileNoBroadband(false);
        } else {
          setProfileHasBroadband(false);
          setProfileBroadbandPartnerId('');
          setProfileNoBroadband(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch customer profile data', err);
    }
  };

  const [availableRewards, setAvailableRewards] = useState(null);
  const [customerRedemptions, setCustomerRedemptions] = useState([]);
  const [redemptionSuccessModal, setRedemptionSuccessModal] = useState(null);

  const fetchAvailableRewards = async () => {
    if (!currentUser || currentUser.role !== 'CUSTOMER') return;
    try {
      const res = await fetch(`${API_BASE}/customer/rewards/available/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableRewards(data);
      }
    } catch (err) {
      console.error('Failed to fetch available rewards', err);
    }
  };

  const fetchCustomerRedemptions = async () => {
    if (!currentUser || currentUser.role !== 'CUSTOMER') return;
    try {
      const res = await fetch(`${API_BASE}/customer/redemptions/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerRedemptions(data);
      }
    } catch (err) {
      console.error('Failed to fetch customer redemptions', err);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'CUSTOMER') {
      fetchCustomerProfileData();
    }
  }, [currentUser?.id, customerAppTab]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'CUSTOMER' && (customerAppTab === 'pointshop' || customerAppTab === 'rewards')) {
      fetchAvailableRewards();
      fetchCustomerRedemptions();
      const onFocus = () => {
        fetchAvailableRewards();
        fetchCustomerRedemptions();
      };
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }
  }, [currentUser?.id, customerAppTab]);

  const handleSaveProfile = async () => {
    if (!currentUser || currentUser.role !== 'CUSTOMER') return;
    setProfileSaving(true);
    try {
      const pRes = await fetch(`${API_BASE}/customer/${currentUser.id}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, address: profileAddress })
      });
      const pData = await pRes.json();

      const cableIdToSave = profileNoCable ? null : (profileCablePartnerId || null);
      const broadbandIdToSave = (profileHasBroadband && !profileNoBroadband) ? (profileBroadbandPartnerId || null) : null;

      const bRes = await fetch(`${API_BASE}/customer/partner-bindings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_user_id: currentUser.id,
          cable_partner_id: cableIdToSave,
          broadband_partner_id: broadbandIdToSave
        })
      });
      const bData = await bRes.json();

      if (pRes.ok && bRes.ok) {
        showToast(t('Profile updated successfully', 'प्रोफाइल सफलतापूर्वक अपडेट किया गया', 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে'));
        setCurrentUser(prev => ({ ...prev, name: profileName, address: profileAddress }));
        fetchCustomerProfileData();
      } else {
        const err = pData.error || bData.error || 'Failed to update profile';
        showToast(err, 'error');
      }
    } catch (err) {
      showToast('Profile update error', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Customer registration
  const handleCustomerRegister = async () => {
    if (!regName || !loginPhone) { showToast('Name and phone required', 'error'); return; }
    if (!noCableProvider && !signupCablePartnerId) {
      showToast('Please select your cable operator or choose Not Listed', 'error');
      return;
    }
    if (!hasBroadbandAnswered) {
      showToast('Please answer whether you have a broadband provider', 'error');
      return;
    }
    if (hasBroadband && !noBroadbandProvider && !signupBroadbandPartnerId) {
      showToast('Please select your broadband operator or choose Not Listed', 'error');
      return;
    }

    try {
      const payload = { phone: loginPhone, name: regName, regionId: regRegion, address: regAddress };
      if (signupCablePartnerId && !noCableProvider) {
        payload.cable_partner_id = signupCablePartnerId;
      }
      if (hasBroadband && signupBroadbandPartnerId && !noBroadbandProvider) {
        payload.broadband_partner_id = signupBroadbandPartnerId;
      }

      let endpoint = `${API_BASE}/auth/register-customer`;
      if (signupReferralCode && signupReferralCode.trim()) {
        payload.referral_code = signupReferralCode.trim();
        endpoint = `${API_BASE}/customer/register-with-referral`;
      }

      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      logApi('POST', endpoint.replace(API_BASE, ''), payload, res.status, data);
      if (res.ok) {
        setCurrentUser(data.user);
        setSelectedRegionId(data.user.region_id);
        showToast(t(`Welcome, ${data.user.name}!`, `स्वागत, ${data.user.name}!`, `স্বাগতম, ${data.user.name}!`));
        setShowCustomerSignup(false);
        setRegName(''); setRegAddress(''); setOtpSent(false); setSignupReferralCode('');
        setSignupCablePartnerId(''); setNoCableProvider(false);
        setHasBroadbandAnswered(false); setHasBroadband(false);
        setSignupBroadbandPartnerId(''); setNoBroadbandProvider(false);
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (err) { showToast('Registration error', 'error'); }
  };

  const handleAdminRefund = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Refund processed successfully!', 'success');
        fetchDbState();
      } else {
        showToast(data.error || 'Refund failed', 'error');
      }
    } catch (err) {
      showToast('Network error processing refund', 'error');
    }
  };

  // §I29: Admin dismiss anomaly
  const handleDismissAnomaly = async (anomalyId) => {
    const reason = dismissReason[anomalyId] || 'No reason provided';
    try {
      const res = await fetch(`${API_BASE}/admin/anomalies/${anomalyId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Flag dismissed and moved to audit history.');
        setDismissReason(prev => { const n = { ...prev }; delete n[anomalyId]; return n; });
        fetchDbState();
      } else {
        showToast(data.error || 'Dismiss failed', 'error');
      }
    } catch (err) {
      showToast('Dismiss error', 'error');
    }
  };

  // §I29: Mark investigated
  const handleInvestigateAnomaly = async (anomalyId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/anomalies/${anomalyId}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Anomaly marked as investigated.');
        fetchDbState();
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Investigate error', 'error');
    }
  };



  // Stockist registration
  const handleStockistRegister = async () => {
    if (!regName || !loginPhone || !regShopName || !regKycNumber2 || !regAddress) {
      showToast('All fields required', 'error'); return;
    }
    try {
      const payload = { phone: loginPhone, name: regName, shopName: regShopName, regionId: regRegion, idType: regKycType2, idNumber: regKycNumber2, address: regAddress };
      const res = await fetch(`${API_BASE}/auth/register-stockist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      logApi('POST', '/auth/register-stockist', payload, res.status, data);
      if (res.ok) {
        setStockistPendingUser(data.user);
        showToast(t('Registration submitted! Awaiting admin approval.', 'पंजीकरण सबमिट!', 'নিবন্ধন জমা হয়েছে!'), 'warning');
        setShowStockistSignup(false);
        setRegName(''); setRegShopName(''); setRegKycNumber2(''); setRegAddress(''); setOtpSent(false);
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (err) { showToast('Registration error', 'error'); }
  };

  const handleRedeemPoints = async () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      showToast('Enter a valid points value', 'error');
      return;
    }
    if (parseFloat(redeemAmount) > customerBalance) {
      showToast('Insufficient points balance', 'error');
      return;
    }
    setShowRedeemConfirmModal(true);
  };

  const executeRedeemPoints = async () => {
    setShowRedeemConfirmModal(false);
    try {
      const payload = { 
        customerId: currentUser.id, 
        amount: parseFloat(redeemAmount),
        redemptionType: 'BROADBAND_DISCOUNT'
      };
      const res = await fetch(`${API_BASE}/ledger/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/ledger/redeem', payload, res.status, data);

      if (res.ok) {
        setDiscountApplied(prev => prev + parseFloat(redeemAmount));
        setRedeemAmount('');
        loadCustomerData();
        if (tourStep === 3) {
          setTourStep(4);
        }
        setRedeemSuccessModal(true);
      } else {
        showToast(data.error || 'Redemption failed', 'error');
      }
    } catch (err) {
      showToast('Redemption service error', 'error');
    }
  };

  const handleSubmitFraudReport = async () => {
    if (!fraudSubject || !fraudSubject.trim()) {
      showToast('Please select a subject', 'error');
      return;
    }
    if (!fraudDescription || fraudDescription.trim().length < 20) {
      showToast('Description must be at least 20 characters long', 'error');
      return;
    }
    try {
      const payload = {
        customerId: currentUser.id,
        subject: fraudSubject,
        description: fraudDescription,
        linkedEntityType: fraudLinkedEntityType || null,
        linkedEntityId: fraudLinkedEntityId || null
      };
      const res = await fetch(`${API_BASE}/customer/fraud-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Report submitted. Our team will review it.', 'success');
        setShowFraudReportModal(false);
        setFraudDescription('');
        setFraudLinkedEntityType('');
        setFraudLinkedEntityId('');
        fetchDbState();
      } else {
        showToast(data.error || 'Report submission failed', 'error');
      }
    } catch (err) {
      showToast('Error submitting report', 'error');
    }
  };

  // Admin Handlers (R5 Customers)
  const handleSaveEditCustomer = async () => {
    if (!selectedCustomerDetail) return;
    try {
      const res = await fetch(`${API_BASE}/admin/customers/${selectedCustomerDetail.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCustomerName, email: editCustomerEmail })
      });
      if (res.ok) {
        showToast('Customer updated', 'success');
        setShowEditCustomerModal(false);
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Update failed', 'error');
      }
    } catch (e) { showToast('Error updating customer', 'error'); }
  };

  const handleChangeCustomerPhone = async () => {
    if (!selectedCustomerDetail) return;
    try {
      const res = await fetch(`${API_BASE}/admin/customers/${selectedCustomerDetail.id}/phone-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPhoneOtp: changePhoneCurrentOtp || '123456', newPhone: changePhoneNewNumber, newPhoneOtp: changePhoneNewOtp || '123456' })
      });
      if (res.ok) {
        showToast('Phone number updated successfully', 'success');
        setShowChangePhoneModal(false);
        setChangePhoneCurrentOtp(''); setChangePhoneNewNumber(''); setChangePhoneNewOtp('');
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Phone change failed', 'error');
      }
    } catch (e) { showToast('Error changing phone', 'error'); }
  };

  const handleIssuePointsCredit = async () => {
    if (!selectedCustomerDetail) return;
    if (!pointsCreditAmount || parseFloat(pointsCreditAmount) <= 0) {
      showToast('Enter a positive points amount', 'error');
      return;
    }
    if (!pointsCreditReason || !pointsCreditReason.trim()) {
      showToast('Reason is required', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/customers/${selectedCustomerDetail.id}/points-credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pointsCreditAmount, reason: pointsCreditReason })
      });
      if (res.ok) {
        showToast('Points credited successfully', 'success');
        setShowPointsCreditModal(false);
        setPointsCreditAmount(''); setPointsCreditReason('');
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Points credit failed', 'error');
      }
    } catch (e) { showToast('Error crediting points', 'error'); }
  };

  const handleToggleCustomerDeactivate = async (cust) => {
    const endpoint = cust.is_active ? 'deactivate' : 'reactivate';
    try {
      const res = await fetch(`${API_BASE}/admin/customers/${cust.id}/${endpoint}`, { method: 'POST' });
      if (res.ok) {
        showToast(`Customer ${cust.is_active ? 'deactivated' : 'reactivated'}`, 'success');
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Action failed', 'error');
      }
    } catch (e) { showToast('Error updating customer status', 'error'); }
  };

  // Admin Handlers (R6 Stockists)
  const handleCreateStockist = async () => {
    if (!createStkName || !createStkPhone) {
      showToast('Name and phone are required', 'error');
      return;
    }
    try {
      const payload = {
        name: createStkName,
        region_id: createStkRegion,
        vendor_id: createStkVendor,
        phone: createStkPhone,
        delivery_radius_km: createStkRadius,
        opening_time: createStkOpen,
        closing_time: createStkClose,
        prep_eta_minutes: createStkEta,
        commission_rate: createStkRate
      };
      const res = await fetch(`${API_BASE}/admin/stockists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('New stockist created successfully', 'success');
        setShowCreateStockistModal(false);
        setCreateStkName(''); setCreateStkPhone('');
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to create stockist', 'error');
      }
    } catch (e) { showToast('Error creating stockist', 'error'); }
  };

  const handleEditStockist = async () => {
    if (!selectedStockistDetail) return;
    try {
      const payload = {
        name: editStkName,
        address: editStkAddress,
        opening_time: editStkOpen,
        closing_time: editStkClose,
        prep_eta_minutes: editStkEta,
        delivery_radius_km: editStkRadius
      };
      const res = await fetch(`${API_BASE}/admin/stockists/${selectedStockistDetail.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Stockist details updated', 'success');
        setShowEditStockistModal(false);
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Update failed', 'error');
      }
    } catch (e) { showToast('Error updating stockist', 'error'); }
  };

  const handlePreviewCommissionRate = async () => {
    if (!selectedStockistDetail || !newCommissionRate) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stockists/${selectedStockistDetail.id}/commission-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate_percent: newCommissionRate })
      });
      const data = await res.json();
      if (res.ok) {
        setCommissionRatePreview(data);
      } else {
        showToast(data.error || 'Preview calculation failed', 'error');
      }
    } catch (e) { showToast('Error fetching rate preview', 'error'); }
  };

  const handleSubmitCommissionRate = async () => {
    if (!selectedStockistDetail || !newCommissionRate) return;
    if (commissionTypedConfirm !== 'CONFIRM') {
      showToast('Type CONFIRM to apply commission rate change', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/stockists/${selectedStockistDetail.id}/commission-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate_percent: newCommissionRate, confirmationText: 'CONFIRM' })
      });
      if (res.ok) {
        showToast('Commission rate updated successfully', 'success');
        setShowCommissionRateModal(false);
        setNewCommissionRate(''); setCommissionRatePreview(null); setCommissionTypedConfirm('');
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Update failed', 'error');
      }
    } catch (e) { showToast('Error updating commission rate', 'error'); }
  };

  const handleChangeStockistRegion = async () => {
    if (!selectedStockistDetail) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stockists/${selectedStockistDetail.id}/region`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region_id: newStockistRegion })
      });
      if (res.ok) {
        showToast('Stockist region changed successfully', 'success');
        setShowStockistRegionModal(false);
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Region change failed', 'error');
      }
    } catch (e) { showToast('Error changing region', 'error'); }
  };

  const handleToggleStockistDeactivate = async (stk) => {
    const endpoint = stk.is_active ? 'deactivate' : 'reactivate';
    try {
      const res = await fetch(`${API_BASE}/admin/stockists/${stk.id}/${endpoint}`, { method: 'POST' });
      if (res.ok) {
        showToast(`Stockist ${stk.is_active ? 'deactivated' : 'reactivated'}`, 'success');
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Action failed', 'error');
      }
    } catch (e) { showToast('Error updating stockist status', 'error'); }
  };

  const handleDeleteStockist = async (stk) => {
    try {
      const res = await fetch(`${API_BASE}/admin/stockists/${stk.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Stockist deleted', 'success');
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Cannot delete: stockist has order history. Deactivate instead.', 'error');
      }
    } catch (e) { showToast('Error deleting stockist', 'error'); }
  };

  // Admin Handlers (R7 Partner Leads)
  const handleUpdateLeadStatus = async (leadId, status) => {
    try {
      const res = await fetch(`${API_BASE}/admin/partner-leads/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Lead status updated to ${status}`, 'success');
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Status update failed', 'error');
      }
    } catch (e) { showToast('Error updating lead status', 'error'); }
  };

  const handleAddLeadNote = async () => {
    if (!selectedLeadDetail || !newLeadNoteText || !newLeadNoteText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/admin/partner-leads/${selectedLeadDetail.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newLeadNoteText })
      });
      if (res.ok) {
        showToast('Note added', 'success');
        setNewLeadNoteText('');
        setShowAddLeadNoteModal(false);
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to add note', 'error');
      }
    } catch (e) { showToast('Error adding note', 'error'); }
  };

  const handleDeleteLead = async (leadId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/partner-leads/${leadId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Lead deleted', 'success');
        setSelectedLeadDetail(null);
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Delete failed', 'error');
      }
    } catch (e) { showToast('Error deleting lead', 'error'); }
  };

  // Admin Handlers (R8 Fraud Reports)
  const handleUpdateFraudReportStatus = async (reportId, status, notes = '') => {
    if (['RESOLVED', 'DISMISSED'].includes(status) && (!notes || notes.trim().length < 10)) {
      showToast('Admin notes (at least 10 chars) are required to resolve or dismiss', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/fraud-reports/${reportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes })
      });
      if (res.ok) {
        showToast(`Fraud report ${status.toLowerCase()}`, 'success');
        setSelectedFraudReportDetail(null);
        setFraudReportAdminNotes('');
        fetchDbState();
      } else {
        const d = await res.json();
        showToast(d.error || 'Status update failed', 'error');
      }
    } catch (e) { showToast('Error updating fraud report', 'error'); }
  };

  // ----------------------------------------------------
  // STOCKIST APP LOGIC
  // ----------------------------------------------------

  const loadStockistData = async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch stockist profile details
      const pRes = await fetch(`${API_BASE}/stockists/by-user/${currentUser.id}`);
      if (!pRes.ok) {
        setStockistProfile(null);
        return;
      }
      const pData = await pRes.json();
      setStockistProfile(pData);

      // 2. Load stockist orders
      const oRes = await fetch(`${API_BASE}/orders?stockistId=${pData.id}`);
      const oData = await oRes.json();
      setStockistOrders(oData);

      // 3. Load stockist inventory products
      const prRes = await fetch(`${API_BASE}/products?regionId=${currentUser.region_id}&stockistId=${pData.id}`);
      const prData = await prRes.json();
      setStockistProducts(prData);

      // 4. Load approved vendor list for this stockist (§12 many-to-many)
      const vRes = await fetch(`${API_BASE}/stockists/${pData.id}/vendors`);
      const vData = await vRes.json();
      setStockistApprovedVendors(vData);
      if (vData.length > 0 && !selectedRestockVendorId) {
        setSelectedRestockVendorId(vData[0].id);
      }

      // Save all vendors list too for selection
      const allVRes = await fetch(`${API_BASE}/admin/vendors`);
      const allVData = await allVRes.json();
      setVendors(allVData);

      // Fetch stockist stats
      const statsRes = await fetch(`${API_BASE}/stockists/${pData.id}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStockistAnalytics(statsData);
      }
    } catch (err) {
      console.error('Error loading stockist details:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (offlineMode) {
      // Store in offline queue
      const updatedQueue = [...offlineQueue, { orderId, status: newStatus, timestamp: new Date().toLocaleTimeString() }];
      setOfflineQueue(updatedQueue);
      
      // Update local orders list instantly for visual feedback
      setStockistOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Offline Mode: Action queued locally`, 'warning');
      return;
    }

    try {
      const payload = { status: newStatus };
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('PATCH', `/orders/${orderId}/status`, payload, res.status, data);

      if (res.ok) {
        showToast(`Order status updated to ${newStatus}`);
        loadStockistData();
        if (newStatus === 'DELIVERED' && tourStep === 2) {
          setTourStep(3);
        }
      } else {
        showToast(data.error || 'Failed to update order status', 'error');
      }
    } catch (err) {
      showToast('Server update error', 'error');
    }
  };

  const handleSyncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    try {
      const payload = { updates: offlineQueue };
      const res = await fetch(`${API_BASE}/orders/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/orders/sync', payload, res.status, data);

      if (res.ok) {
        showToast(`Synced ${data.synced_count} offline actions successfully!`);
        setOfflineQueue([]);
        loadStockistData();
        if (tourStep === 2) {
          setTourStep(3);
        }
      } else {
        showToast('Sync failed', 'error');
      }
    } catch (err) {
      showToast('Connection to server failed during sync', 'error');
    }
  };

  const handlePurchaseStock = async (productId, quantity, vendorId = null) => {
    if (!stockistProfile) return;
    try {
      const payload = {
        stockistId: stockistProfile.id,
        items: [{ productId, quantity: parseInt(quantity, 10) }],
        vendorId
      };
      const res = await fetch(`${API_BASE}/stockists/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/stockists/restock', payload, res.status, data);

      if (res.ok) {
        showToast('Stock purchased and added from Wholesaler!');
        loadStockistData();
      } else {
        showToast(data.error || 'Restock failed', 'error');
      }
    } catch (err) {
      showToast('Network error on restock', 'error');
    }
  };

  // ----------------------------------------------------
  // ADMIN DASHBOARD LOGIC
  // ----------------------------------------------------

  const handleApproveKyc = async (userId) => {
    // Select vendor corresponding to the user's region
    const userToApprove = pendingKyc.find(u => u.id === userId);
    if (!userToApprove) return;

    const matchingVendor = vendors.find(v => v.region_id === userToApprove.region_id);
    if (!matchingVendor) {
      showToast('Please create a Vendor for this region first!', 'error');
      return;
    }

    try {
      const payload = {
        userId,
        vendorId: matchingVendor.id,
        deliveryRadius: userToApprove.region_id === 'r2' ? 6.0 : 3.0,
        minOrderValue: userToApprove.region_id === 'r2' ? 100 : 200
      };
      
      const res = await fetch(`${API_BASE}/admin/approve-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/admin/approve-kyc', payload, res.status, data);

      if (res.ok) {
        showToast(`Approved stockist! Assigned vendor: ${matchingVendor.name}`);
        fetchDbState();
      } else {
        showToast(data.error || 'Approval failed', 'error');
      }
    } catch (err) {
      showToast('Admin server error', 'error');
    }
  };

  const handleSaveCommissionRate = async () => {
    try {
      const payload = {
        category: configCategory,
        ratePercent: parseFloat(configRate),
        regionId: configRegion
      };
      const res = await fetch(`${API_BASE}/admin/commission-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/admin/commission-rates', payload, res.status, data);

      if (res.ok) {
        showToast('Commission rate updated!');
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to update commission rate', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const handleCompleteRedemption = async (ledgerId) => {
    try {
      const payload = { ledgerId };
      const res = await fetch(`${API_BASE}/admin/complete-redemption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/admin/complete-redemption', payload, res.status, data);

      if (res.ok) {
        showToast('Redemption sync logged in billing system successfully!');
        fetchDbState();
        if (tourStep === 4) {
          setTourCompleted(true);
        }
      } else {
        showToast('Failed to complete', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const handleCreateVendor = async () => {
    if (!adminNewVendor) return;
    try {
      const payload = { name: adminNewVendor, regionId: selectedRegionId };
      const res = await fetch(`${API_BASE}/admin/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/admin/vendors', payload, res.status, data);

      if (res.ok) {
        showToast(`Vendor ${adminNewVendor} created!`);
        setAdminNewVendor('');
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to create vendor', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const handleSaveStockistCommission = async (stockistId, ratePercent) => {
    try {
      const payload = { stockistId, ratePercent: parseFloat(ratePercent) };
      const res = await fetch(`${API_BASE}/admin/stockist-commission-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/admin/stockist-commission-rates', payload, res.status, data);
      if (res.ok) {
        showToast('Shop commission override updated successfully!');
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to update override', 'error');
      }
    } catch (err) {
      showToast('Network error saving override', 'error');
    }
  };

  const handleSavePointsEarnConfig = async (regionId, stockistId, earnRatePercent) => {
    try {
      const payload = { regionId, stockistId: stockistId || null, earnRatePercent: parseFloat(earnRatePercent) };
      const res = await fetch(`${API_BASE}/admin/points-earn-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/admin/points-earn-config', payload, res.status, data);
      if (res.ok) {
        showToast('Points earn config updated successfully!');
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to update earn rate', 'error');
      }
    } catch (err) {
      showToast('Network error saving points config', 'error');
    }
  };

  const handleAssignVendorToStockist = async (stockistId, vendorId) => {
    try {
      const payload = { stockistId, vendorId };
      const res = await fetch(`${API_BASE}/admin/stockist-vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/admin/stockist-vendors', payload, res.status, data);
      if (res.ok) {
        showToast('Wholesaler approved and assigned to shop!');
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to assign wholesaler', 'error');
      }
    } catch (err) {
      showToast('Network error assigning wholesaler', 'error');
    }
  };

  const handleFlagAnomaly = async (anomalyId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/anomalies/${anomalyId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      logApi('POST', `/admin/anomalies/${anomalyId}/flag`, null, res.status, data);
      if (res.ok) {
        showToast('Stockist account flagged for review.');
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to flag anomaly', 'error');
      }
    } catch (err) {
      showToast('Network error flagging anomaly', 'error');
    }
  };

  const handleSwitchToDelivery = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/fulfillment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillmentType: 'DELIVERY' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Switched to delivery! Payouts updated.');
        if (checkoutResult) {
          setCheckoutResult(prev => {
            const updatedOrders = prev.orders.map(o => o.id === orderId ? data.order : o);
            return { ...prev, orders: updatedOrders };
          });
        }
        loadCustomerData();
      } else {
        showToast(data.error || 'Failed to switch to delivery', 'error');
      }
    } catch (err) {
      showToast('Fulfillment service error', 'error');
    }
  };

  const handleSavePickupSlot = async (orderId, slot) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/fulfillment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupSlot: slot })
      });
      if (res.ok) {
        showToast('Pickup slot confirmed!');
        if (checkoutResult) {
          const data = await res.json();
          setCheckoutResult(prev => {
            const updatedOrders = prev.orders.map(o => o.id === orderId ? data.order : o);
            return { ...prev, orders: updatedOrders };
          });
        }
        loadCustomerData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save slot', 'error');
      }
    } catch (err) {
      showToast('Fulfillment service error', 'error');
    }
  };

  const handleSaveFeedback = async (role) => {
    if (!submittingFeedbackOrder) return;
    try {
      let payload = {};
      if (role === 'CUSTOMER') {
        payload = {
          reporterRole: 'CUSTOMER',
          reporterId: currentUser.id,
          reporterName: currentUser.name,
          targetRole: 'STOCKIST',
          targetId: submittingFeedbackOrder.stockist_id,
          targetName: submittingFeedbackOrder.stockist_name,
          orderId: submittingFeedbackOrder.id,
          rating: feedbackRating,
          reason: feedbackReason,
          reportFlag: reportFlag
        };
      } else {
        payload = {
          reporterRole: 'STOCKIST',
          reporterId: stockistProfile.id,
          reporterName: stockistProfile.name,
          targetRole: 'CUSTOMER',
          targetId: submittingFeedbackOrder.customer_id,
          targetName: submittingFeedbackOrder.customer_name || 'Amit Sen',
          orderId: submittingFeedbackOrder.id,
          rating: feedbackRating,
          reason: feedbackReason,
          reportFlag: reportFlag
        };
      }
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      logApi('POST', '/feedback', payload, res.status, data);
      if (res.ok) {
        showToast('Feedback submitted successfully!');
        setSubmittingFeedbackOrder(null);
        setFeedbackRating(5);
        setFeedbackReason('');
        setReportFlag(false);
        loadCustomerData();
        loadStockistData();
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to submit report', 'error');
      }
    } catch (err) {
      showToast('Network error submitting feedback', 'error');
    }
  };

  const handleReorder = async (order) => {
    try {
      const targetStockist = customerStockists.find(s => s.id === order.stockist_id);
      if (!targetStockist) {
        showToast('Store is no longer active in your area', 'error');
        return;
      }
      setSelectedStockist(targetStockist);
      
      const res = await fetch(`${API_BASE}/products?regionId=${currentUser.region_id}&stockistId=${targetStockist.id}`);
      if (!res.ok) {
        showToast('Failed to load store products', 'error');
        return;
      }
      const currentProds = await res.json();
      
      const newCart = [];
      let omittedCount = 0;
      
      order.items.forEach(pastItem => {
        const currentProd = currentProds.find(p => p.id === pastItem.product_id);
        if (currentProd && currentProd.stock_qty > 0) {
          const qty = Math.min(pastItem.quantity, currentProd.stock_qty);
          newCart.push({
            product: currentProd,
            quantity: qty,
            stockistId: targetStockist.id,
            stockistName: targetStockist.name
          });
          if (qty < pastItem.quantity) {
            omittedCount++;
          }
        } else {
          omittedCount++;
        }
      });
      
      if (newCart.length === 0) {
        showToast('All items from this past order are out of stock', 'error');
        return;
      }
      
      setCustomerCart(newCart);
      setCustomerAppTab('store');
      if (omittedCount > 0) {
        showToast(`Cart refilled! Omitted ${omittedCount} out-of-stock items.`, 'warning');
      } else {
        showToast('Cart refilled with past order items!', 'success');
      }
    } catch (err) {
      showToast('Reorder failed', 'error');
    }
  };

  const handleAddNewProduct = async () => {
    if (!newProdName || !newProdPrice || !newProdInitialStock) {
      showToast('Please fill all required product fields', 'error');
      return;
    }
    if (!newProdBillFile) {
      showToast("New SKUs require a bill photo. Please select a photo.", 'error');
      return;
    }
    if (newProdBillFile.size > 8 * 1024 * 1024) {
      showToast("Bill photo exceeds 8 MB limit.", 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('bill_photo', newProdBillFile);
      formData.append('name', newProdName);
      formData.append('price', parseFloat(newProdPrice));
      formData.append('costPrice', newProdCostPrice ? parseFloat(newProdCostPrice) : parseFloat(newProdPrice) * 0.75);
      formData.append('category', newProdCategory);
      formData.append('initialStock', parseInt(newProdInitialStock, 10));
      formData.append('stockistId', stockistProfile.id);
      formData.append('regionId', currentUser.region_id);

      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Product ${newProdName} added successfully with bill!`, 'success');
        if (data.bill_photo && data.bill_photo.public_url) {
          setUploadedBillPreviewUrl(data.bill_photo.public_url);
        }
        setShowAddProductModal(false);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdCostPrice('');
        setNewProdCategory('groceries');
        setNewProdInitialStock('10');
        setNewProdBillFile(null);
        loadStockistData();
        fetchDbState();
      } else {
        showToast(data.message || data.error || 'Failed to add product', 'error');
      }
    } catch (err) {
      showToast('Error adding product', 'error');
    }
  };

  const handleStartEditProduct = (prod) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);
    setEditProdPrice(prod.price.toString());
    setEditProdCostPrice((prod.cost_price !== undefined && prod.cost_price !== null ? prod.cost_price : prod.price * 0.75).toString());
    setEditProdBillFile(null);
  };

  const handleSaveEditProduct = async () => {
    if (!editProdName.trim() || !editProdPrice.trim() || !editProdCostPrice.trim()) {
      showToast('All fields are required', 'error');
      return;
    }
    const priceNum = parseFloat(editProdPrice);
    const costNum = parseFloat(editProdCostPrice);
    if (priceNum <= 0) {
      showToast('Price must be greater than 0', 'error');
      return;
    }
    if (costNum < 0 || costNum > priceNum) {
      showToast('Cost price must be between 0 and selling price', 'error');
      return;
    }

    const priceChanged = Math.abs(priceNum - editingProduct.price) > 0.001 || Math.abs(costNum - editingProduct.cost_price) > 0.001;
    if (priceChanged && !editProdBillFile) {
      showToast('Price change detected. A new bill photo is required.', 'error');
      return;
    }
    if (editProdBillFile && editProdBillFile.size > 8 * 1024 * 1024) {
      showToast('Bill photo exceeds 8 MB limit.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      if (editProdBillFile) formData.append('bill_photo', editProdBillFile);
      formData.append('name', editProdName);
      formData.append('price', priceNum);
      formData.append('costPrice', costNum);
      formData.append('stockistId', stockistProfile.id);

      const res = await fetch(`${API_BASE}/products/${editingProduct.id}`, {
        method: 'PATCH',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Product updated successfully!', 'success');
        setEditingProduct(null);
        setEditProdBillFile(null);
        loadStockistData();
        fetchDbState();
      } else {
        showToast(data.message || data.error || 'Failed to update product', 'error');
      }
    } catch (err) {
      showToast('Network error updating product', 'error');
    }
  };

  const handleFlagBillPhoto = async () => {
    if (!flaggingBill) return;
    if (!flagReasonText || flagReasonText.trim().length < 10) {
      showToast('Reason must be at least 10 characters', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/bill-photos/${flaggingBill.id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: currentUser?.id || 'u-admin', reason: flagReasonText.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Bill photo flagged successfully', 'success');
        setShowFlagBillModal(false);
        setFlaggingBill(null);
        setFlagReasonText('');
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to flag bill photo', 'error');
      }
    } catch (err) {
      showToast('Error flagging bill photo', 'error');
    }
  };

  const handleUnflagBillPhoto = async () => {
    if (!unflaggingBill) return;
    try {
      const res = await fetch(`${API_BASE}/admin/bill-photos/${unflaggingBill.id}/unflag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: currentUser?.id || 'u-admin' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Bill photo unflagged/resolved successfully', 'success');
        setShowUnflagBillModal(false);
        setUnflaggingBill(null);
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to unflag bill photo', 'error');
      }
    } catch (err) {
      showToast('Error unflagging bill photo', 'error');
    }
  };

  const handleViewSignedUrl = async (billTarget) => {
    const photoObj = typeof billTarget === 'object' ? billTarget : null;
    const billId = typeof billTarget === 'string' ? billTarget : photoObj?.id;
    const key = photoObj?.r2_key;
    if (key) {
      window.open(`${API_BASE}/bills/${key}`, '_blank');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/bill-photos/${billId}/signed-url`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.signed_url) {
        window.open(`${API_BASE}/bills/${billId}`, '_blank');
      } else {
        showToast(data.message || data.error || 'Failed to get signed URL', 'error');
      }
    } catch (err) {
      showToast('Error fetching signed URL', 'error');
    }
  };

  const handleVerifyPickupPIN = async (orderId) => {
    const pin = enteredPins[orderId];
    if (!pin) {
      showToast('Please enter the 4-digit verification PIN', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/verify-pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Pickup PIN verified! Order completed.', 'success');
        setEnteredPins(prev => ({ ...prev, [orderId]: '' }));
        loadStockistData();
        fetchDbState();
      } else {
        showToast(data.error || 'Incorrect PIN', 'error');
      }
    } catch (err) {
      showToast('PIN verification error', 'error');
    }
  };

  const handleResetDb = () => {
    triggerConfirmModal(
      t('Reset Database', 'डेटाबेस रीसेट करें', 'ডাটাবেস রিসেট করুন'),
      t('Are you sure you want to reset all demo data and restore defaults? This will clear all orders.', 'क्या आप सभी डेमो डेटा को रीसेट करना चाहते हैं और डिफ़ॉल्ट बहाल करना चाहते हैं? इससे सभी ऑर्डर साफ़ हो जाएंगे।', 'আপনি কি নিশ্চিত যে আপনি সমস্ত ডেমো ডাটা রিসেট করতে চান? এর ফলে সমস্ত অর্ডার মুছে যাবে।'),
      () => performReset(),
      true,
      t('Yes, Reset', 'हाँ, रीसेट करें', 'হ্যাঁ, রিসেট করুন'),
      t('Cancel', 'रद्द करें', 'বাতিল করুন')
    );
  };

  // CSV Exporter for billing sync
  const exportRedemptionsCsv = () => {
    if (pendingRedemptions.length === 0) {
      showToast('No redemptions to export', 'error');
      return;
    }
    const headers = 'ID,Timestamp,Customer Name,Customer Phone,Amount,Status,Redemption Type\n';
    const rows = pendingRedemptions.map(r => 
      `"${r.id}","${r.created_at}","${r.customer_name}","${r.customer_phone}",${Math.abs(r.amount)},"${r.billing_sync_status}","${r.description || ''}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ISP_Redemptions_${new Date().toISOString().substring(0,10)}.csv`);
    a.click();
    showToast('CSV export downloaded!');
  };

  // Toggle offline simulator
  const toggleOfflineMode = () => {
    if (offlineMode) {
      // Sync queue when coming back online
      setOfflineMode(false);
      showToast('Connected to network. Syncing queued tasks...', 'info');
      setTimeout(() => {
        handleSyncOfflineQueue();
      }, 800);
    } else {
      setOfflineMode(true);
      showToast('Disconnected from network. Actions will be queued.', 'warning');
    }
  };

  // ----------------------------------------------------
  // UI RENDERERS
  // ----------------------------------------------------

  const renderAuthForm = (appRole = activeRole) => {
    const isCustomerApp = appRole === 'customer';
    const isStockistApp = appRole === 'stockist';
    const isAdminApp = appRole === 'admin';

    const loginTitle = isStockistApp
      ? t('Shopkeeper Login', 'दुकानदार लॉगिन', 'দোকানদার লগইন')
      : isAdminApp
      ? t('Admin Login', 'प्रशासक लॉगिन', 'অ্যাডমিন লগইন')
      : t('Customer Login', 'ग्राहक लॉगिन', 'ক্রেতা লগইন');

    const loginSubtitle = isStockistApp
      ? t('Stockist & Store Manager Login', 'स्टॉकिस्ट और स्टोर प्रबंधक लॉगिन', 'স্টকিস্ট ও স্টোর ম্যানেজার লগইন')
      : isAdminApp
      ? t('Platform Administrator Operations', 'प्लेटफ़ॉर्म प्रशासक संचालन', 'প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেটর অপারেশনস')
      : t('Hyperlocal ISP Commerce Login', 'हाईपरलोकल आईएसपी कॉमर्स लॉगिन', 'হাইপারলোকাল আইএসপি কমার্স লগইন');

    const renderCustomerSignupBtn = () => (
      <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.7rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
        onClick={() => { if (!otpSent) handleSendOtp(); setShowCustomerSignup(true); setShowStockistSignup(false); }}>
        <UserPlus size={12} /> {t("Sign Up (Customer)", "साइन अप (ग्राहक)", "সাইন আপ (ক্রেতা)")}
      </button>
    );

    const renderStockistSignupBtn = () => (
      <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.7rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
        onClick={() => { if (!otpSent) handleSendOtp(); setShowStockistSignup(true); setShowCustomerSignup(false); }}>
        <Store size={12} /> {t("Open a Shop", "दुकान खोलें", "দোকান খুলুন")}
      </button>
    );

    return (
      <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', marginBottom: '0.75rem' }}>
            <Smartphone size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{loginTitle}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{loginSubtitle}</p>
        </div>

        {!otpSent ? (
          <>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input 
                type="tel" 
                placeholder="Enter 10-digit mobile number" 
                className="text-input" 
                value={loginPhone}
                onChange={e => setLoginPhone(e.target.value.replace(/\D/g,'').substring(0,10))}
              />
            </div>
            <button className="btn" onClick={handleSendOtp}>Send One-Time Password</button>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
              <strong>Demo Phone Options:</strong>
              {isCustomerApp && (
                <>
                  <div style={{ marginTop: '0.25rem' }}>• 9876543210 (Customer Garia)</div>
                  <div>• 8765432109 (Customer Bishnupur)</div>
                </>
              )}
              {isStockistApp && (
                <>
                  <div style={{ marginTop: '0.25rem' }}>• 7654321098 (Stockist Garia)</div>
                  <div>• 4321098765 (Stockist Garia — Banerjee Corner)</div>
                  <div>• 6543210987 (Stockist Bishnupur)</div>
                </>
              )}
              {isAdminApp && (
                <>
                  <div style={{ marginTop: '0.25rem' }}>• 9876543210 (Admin Account)</div>
                </>
              )}
              {!isCustomerApp && !isStockistApp && !isAdminApp && (
                <>
                  <div style={{ marginTop: '0.25rem' }}>• 9876543210 (Customer Garia)</div>
                  <div>• 7654321098 (Stockist Garia)</div>
                </>
              )}
            </div>

            {/* New account? signup links role-gated */}
            {isCustomerApp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {t('New here? Create an account', 'नए हैं? खाता बनाएं', 'নতুন? অ্যাকাউন্ট তৈরি করুন')}
                </p>
                {renderCustomerSignupBtn()}
              </div>
            )}
            {isStockistApp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {t('Want to sell on FastNet? Register your shop', 'फास्टनेट पर बेचना चाहते हैं? अपनी दुकान पंजीकृत करें', 'ফাস্টনেটে বিক্রি করতে চান? আপনার দোকান নিবন্ধন করুন')}
                </p>
                {renderStockistSignupBtn()}
              </div>
            )}
          </>
        ) : showCustomerSignup ? (
          /* Customer Sign Up Flow */
          <>
            <div style={{ background: 'rgba(99,102,241,0.08)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.75rem', textAlign: 'center' }}>
              <UserPlus size={14} style={{ color: 'var(--primary)', marginRight: '0.35rem', verticalAlign: 'middle' }} />
              {t('New Customer Registration', 'नया ग्राहक पंजीकरण', 'নতুন ক্রেতা নিবন্ধন')} — {loginPhone}
            </div>
            <div className="input-group">
              <label className="input-label">{t('Full Name', 'पूरा नाम', 'পুরো নাম')}</label>
              <input type="text" placeholder="e.g. Joy Dev" className="text-input" value={regName} onChange={e => setRegName(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('Select Region', 'क्षेत्र चुनें', 'অঞ্চল নির্বাচন করুন')}</label>
              <select className="text-input" value={regRegion} onChange={e => setRegRegion(e.target.value)}>
                <option value="">{t('Select Region', 'क्षेत्र चुनें', 'অঞ্চল নির্বাচন করুন')}</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {regions.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {t('No service areas are available yet. Please check back soon.', 'कोई सेवा क्षेत्र अभी उपलब्ध नहीं है। कृपया जल्द ही पुनः प्रयास करें।', 'এখনও কোনো পরিষেবা ক্ষেত্র উপলব্ধ নেই। দয়া করে শীঘ্রই আবার পরীক্ষা করুন।')}
                </p>
              )}
            </div>

            {/* Step A: Choose your local cable operator */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                {t('CHOOSE YOUR LOCAL CABLE OPERATOR', 'अपने स्थानीय केबल ऑपरेटर को चुनें', 'আপনার স্থানীয় কেবল অপারেটর বাছুন')}
              </label>
              <select
                className="text-input"
                value={noCableProvider ? 'NOT_LISTED' : signupCablePartnerId}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'NOT_LISTED') {
                    setNoCableProvider(true);
                    setSignupCablePartnerId('');
                  } else {
                    setNoCableProvider(false);
                    setSignupCablePartnerId(val);
                  }
                }}
              >
                <option value="" disabled>-- Select --</option>
                {(availablePartners.cable || []).map(p => (
                  <option key={p.id} value={p.id}>{p.display_name}</option>
                ))}
                <option value="NOT_LISTED" style={{ fontStyle: 'italic', fontSize: '0.85em' }}>
                  {t("My provider isn't listed yet", "मेरा प्रदाता अभी सूचीबद्ध नहीं है", "আমার প্রদানকারী এখনও তালিকাভুক্ত নয়")}
                </option>
              </select>
              {noCableProvider && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                  {t(
                    "You'll earn points and redeem stockist rewards. Cable recharge rewards will unlock when your provider joins.",
                    "आप अंक अर्जित करेंगे और स्टॉकिस्ट पुरस्कार रिडीम करेंगे। आपके प्रदाता के शामिल होने पर केबल रीचार्ज पुरस्कार अनलॉक हो जाएंगे।",
                    "আপনি পয়েন্ট অর্জন করবেন এবং স্টকিস্ট পুরস্কার রিডিম করবেন। আপনার প্রদানকারী যোগ দিলে কেবল রিচার্জ পুরষ্কার আনলক হবে।"
                  )}
                </p>
              )}
            </div>

            {/* Step B: Do you have a local internet/wi-fi provider? */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 'bold' }}>
                {t('Do you have a local internet/wi-fi provider?', 'क्या आपके पास स्थानीय इंटरनेट/वाई-फाई प्रदाता है?', 'আপনার কি কোনো স্থানীয় ইন্টারনেট/ওয়াই-ফাই প্রদানকারী আছে?')}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    background: hasBroadbandAnswered && hasBroadband ? 'var(--success, #10b981)' : 'var(--bg-card, rgba(255,255,255,0.05))',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => {
                    setHasBroadbandAnswered(true);
                    setHasBroadband(true);
                  }}
                >
                  {t('Yes', 'हाँ', 'হ্যাঁ')}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    background: hasBroadbandAnswered && !hasBroadband ? 'var(--danger, #ef4444)' : 'var(--bg-card, rgba(255,255,255,0.05))',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => {
                    setHasBroadbandAnswered(true);
                    setHasBroadband(false);
                    setSignupBroadbandPartnerId('');
                    setNoBroadbandProvider(false);
                  }}
                >
                  {t('No', 'नहीं', 'না')}
                </button>
              </div>

              {hasBroadbandAnswered && hasBroadband && (
                <div style={{ marginTop: '0.5rem' }}>
                  <select
                    className="text-input"
                    value={noBroadbandProvider ? 'NOT_LISTED' : signupBroadbandPartnerId}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'NOT_LISTED') {
                        setNoBroadbandProvider(true);
                        setSignupBroadbandPartnerId('');
                      } else {
                        setNoBroadbandProvider(false);
                        setSignupBroadbandPartnerId(val);
                      }
                    }}
                  >
                    <option value="" disabled>-- Select --</option>
                    {(availablePartners.broadband || []).map(p => (
                      <option key={p.id} value={p.id}>{p.display_name}</option>
                    ))}
                    <option value="NOT_LISTED" style={{ fontStyle: 'italic', fontSize: '0.85em' }}>
                      {t("My provider isn't listed yet", "मेरा प्रदाता अभी सूचीबद्ध नहीं है", "আমার প্রদানকারী এখনও তালিকাভুক্ত নয়")}
                    </option>
                  </select>
                </div>
              )}
            </div>
            <div className="input-group">
              <label className="input-label">{t('Delivery Address (Optional)', 'डिलीवरी पता', 'ডেলিভারি ঠিকানা')}</label>
              <input type="text" placeholder="e.g. 12 Main Road, Garia" className="text-input" value={regAddress} onChange={e => setRegAddress(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('Referral Code (Optional)', 'रेफरल कोड (वैकल्पिक)', 'রেফারেল কোড (ঐচ্ছিক)')}</label>
              <input type="text" placeholder="e.g. ABC123" className="text-input" value={signupReferralCode} onChange={e => setSignupReferralCode(e.target.value.toUpperCase())} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowCustomerSignup(false); setOtpSent(false); }}>← {t('Back', 'वापस', 'ফিরে')}</button>
              <button className="btn btn-accent" style={{ flex: 2 }} onClick={handleCustomerRegister} disabled={regions.length === 0}>{t('Create Account', 'खाता बनाएं', 'অ্যাকাউন্ট তৈরি')}</button>
            </div>
          </>
        ) : showStockistSignup ? (
          /* Stockist Sign Up Flow */
          <>
            <div style={{ background: 'rgba(245,158,11,0.08)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem', textAlign: 'center' }}>
              <Store size={14} style={{ color: 'var(--warning)', marginRight: '0.35rem', verticalAlign: 'middle' }} />
              {t('Register Local Shop (KYC Required)', 'स्थानीय दुकान पंजीकरण (KYC आवश्यक)', 'স্থানীয় দোকান নিবন্ধন (KYC প্রয়োজন)')} — {loginPhone}
            </div>
            {isCustomerApp && renderCustomerSignupBtn()}
            {isStockistApp && renderStockistSignupBtn()}
            <div className="input-group">
              <label className="input-label">{t('Owner Name', 'मालिक का नाम', 'মালিকের নাম')}</label>
              <input type="text" placeholder="e.g. Rafiq Ahmed" className="text-input" value={regName} onChange={e => setRegName(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('Shop Name', 'दुकान का नाम', 'দোকানের নাম')}</label>
              <input type="text" placeholder="e.g. Ahmed General Store" className="text-input" value={regShopName} onChange={e => setRegShopName(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('Region', 'क्षेत्र', 'অঞ্চল')}</label>
              <select className="text-input" value={regRegion} onChange={e => setRegRegion(e.target.value)}>
                <option value="">{t('Select Region', 'क्षेत्र चुनें', 'অঞ্চল निर्वाचन করুন')}</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {regions.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {t('No service areas are available yet. Please check back soon.', 'कोई सेवा क्षेत्र अभी उपलब्ध नहीं है। कृपया जल्द ही पुनः प्रयास करें।', 'এখনও কোনো পরিষেবা ক্ষেত্র উপলব্ধ নেই। দয়া করে শীঘ্রই আবার পরীক্ষা করুন।')}
                </p>
              )}
            </div>
            <div className="input-group">
              <label className="input-label">{t('KYC Document Type', 'KYC दस्तावेज़ प्रकार', 'KYC ডকুমেন্ট ধরন')}</label>
              <select className="text-input" value={regKycType2} onChange={e => setRegKycType2(e.target.value)}>
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Trade License">Trade License</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('Document ID Number', 'दस्तावेज़ नंबर', 'ডকুমেন্ট নম্বর')}</label>
              <input type="text" placeholder="e.g. 1234-5678-9012" className="text-input" value={regKycNumber2} onChange={e => setRegKycNumber2(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('Shop Address', 'दुकान का पता', 'দোকানের ঠিকানা')}</label>
              <input type="text" placeholder="e.g. Shop 5, Market Road" className="text-input" value={regAddress} onChange={e => setRegAddress(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowStockistSignup(false); setOtpSent(false); }}>← {t('Back', 'वापस', 'ফিরে')}</button>
              <button className="btn btn-accent" style={{ flex: 2 }} onClick={handleStockistRegister}>{t('Submit for KYC Review', 'KYC समीक्षा सबमिट', 'KYC পর্যালোচনায় জমা')}</button>
            </div>
          </>
        ) : (
          <>
            <div className="input-group" style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.75rem', textAlign: 'center' }}>
              OTP sent to <strong>{loginPhone}</strong> — demo code: <strong>123456</strong>
            </div>
            <div className="input-group">
              <label className="input-label">Enter 6-Digit OTP</label>
              <input 
                type="text" 
                placeholder="Enter 123456" 
                maxLength={6}
                className="text-input" 
                value={loginOtp}
                onChange={e => setLoginOtp(e.target.value.replace(/\D/g,''))}
                style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setOtpSent(false)}>Back</button>
              <button className="btn" style={{ flex: 2 }} onClick={handleVerifyOtp}>Verify &amp; Login</button>
            </div>

            {/* Don't have an account? */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>
                {t("Don't have an account?", "खाता नहीं है?", "অ্যাকাউন্ট নেই?")}
              </p>
              {isCustomerApp && renderCustomerSignupBtn()}
              {isStockistApp && renderStockistSignupBtn()}
            </div>
          </>
        )}
      </div>
    );
  };

  const handlePartnerSubmit = async () => {
    if (!partnerName.trim() || !partnerPhone.trim()) {
      showToast('Name and phone are required', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/partner-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: partnerName, phone: partnerPhone })
      });
      if (res.ok) {
        showToast("Thanks — we'll contact you soon.", "success");
        setPartnerName('');
        setPartnerPhone('');
        fetchDbState();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to submit details', 'error');
      }
    } catch (e) {
      showToast('Network error submitting details', 'error');
    }
  };

  // ----------------------------------------------------
  // PARTNER APP HANDLERS & HELPERS (ROUND P4b)
  // ----------------------------------------------------
  const fetchPartnerDashboard = async (tokenOverride) => {
    const token = tokenOverride || partnerSessionToken || localStorage.getItem('fastnet_partner_session');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/partner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        handlePartnerLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPartnerDashData(data);
      }
    } catch (err) {
      console.error('Error fetching partner dashboard:', err);
    }
  };

  const fetchPartnerQueue = async (tokenOverride) => {
    const token = tokenOverride || partnerSessionToken || localStorage.getItem('fastnet_partner_session');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/partner/redemption-queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerQueueList(data);
      }
      const histRes = await fetch(`${API_BASE}/partner/redemption-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (histRes.ok) {
        const histData = await histRes.json();
        setPartnerDisputesList(histData.filter(item => item.status === 'DISPUTED'));
        setFbFulfilledRedemptions(histData.filter(item => item.status === 'FULFILLED'));
      }
    } catch (err) {
      console.error('Error fetching partner queue:', err);
    }
  };

  const fetchPartnerPackages = async (tokenOverride) => {
    const token = tokenOverride || partnerSessionToken || localStorage.getItem('fastnet_partner_session');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/partner/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerPackagesList(data.packages || []);
      }
    } catch (err) {
      console.error('Error fetching partner packages:', err);
    }
  };

  const fetchPartnerRegions = async (tokenOverride) => {
    const token = tokenOverride || partnerSessionToken || localStorage.getItem('fastnet_partner_session');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/partner/regions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerRegionsList(data);
      }
      const regRes = await fetch(`${API_BASE}/regions`);
      if (regRes.ok) {
        const regData = await regRes.json();
        setAllSystemRegions(regData);
      } else {
        setAllSystemRegions([]);
      }
    } catch (err) {
      console.error('Error fetching partner regions:', err);
    }
  };

  const fetchPartnerFeedback = async (tokenOverride) => {
    const token = tokenOverride || partnerSessionToken || localStorage.getItem('fastnet_partner_session');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/partner/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerFeedbackList(data);
      }
    } catch (err) {
      console.error('Error fetching partner feedback:', err);
    }
  };

  const fetchPartnerProfile = async (tokenOverride) => {
    const token = tokenOverride || partnerSessionToken || localStorage.getItem('fastnet_partner_session');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/partner/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerData(data.partner);
        setPProfDisplayName(data.partner.display_name || '');
        setPProfContactPhone(data.partner.contact_phone || data.user.phone || '');
        setInitialContactPhone(data.partner.contact_phone || data.user.phone || '');
        setPProfContactEmail(data.partner.contact_email || '');
        setPProfAddress(data.partner.address || '');
        setPProfCounts(data.counts || { bound_customers: 0, redemptions_all_time: 0, disputes_open: 0 });
      }
    } catch (err) {
      console.error('Error fetching partner profile:', err);
    }
  };

  const fetchPartnerNotifications = async (tokenOverride) => {
    const token = tokenOverride || partnerSessionToken || localStorage.getItem('fastnet_partner_session');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/partner/notifications?unread_only=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerNotifList(data);
        setUnreadNotifCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching partner notifications:', err);
    }
  };

  const loadPartnerAppData = (token) => {
    fetchPartnerDashboard(token);
    fetchPartnerQueue(token);
    fetchPartnerPackages(token);
    fetchPartnerRegions(token);
    fetchPartnerFeedback(token);
    fetchPartnerProfile(token);
    fetchPartnerNotifications(token);
  };

  const handlePartnerEmailLogin = async () => {
    if (!partnerLoginEmail || !partnerLoginPassword) {
      showToast('Email and password required', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/partner/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: partnerLoginEmail, password: partnerLoginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('fastnet_partner_session', data.session_token);
        setPartnerSessionToken(data.session_token);
        setCurrentUser(data.user);
        setPartnerData(data.partner);
        setActiveRole('partner');
        setPartnerAppTab('dashboard');
        loadPartnerAppData(data.session_token);
        showToast('Logged in successfully!', 'success');
      } else {
        showToast(data.error || 'Login failed', 'error');
      }
    } catch (err) {
      showToast('Network error during login', 'error');
    }
  };

  const handlePartnerForgotPassword = async () => {
    if (!partnerForgotEmail) {
      showToast('Please enter your email', 'error');
      return;
    }
    try {
      await fetch(`${API_BASE}/partner/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: partnerForgotEmail })
      });
      showToast('If your email is registered, a reset link has been sent.', 'success');
      setShowPartnerForgotForm(false);
    } catch (err) {
      showToast('Error requesting password reset', 'error');
    }
  };

  const handlePartnerSendOtp = async () => {
    if (!partnerLoginPhone) {
      showToast('Please enter phone number', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/partner/auth/login-otp-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: partnerLoginPhone })
      });
      const data = await res.json();
      if (res.ok) {
        setPartnerOtpSent(true);
        showToast('OTP sent (demo code 123456)', 'info');
      } else {
        showToast(data.error || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      showToast('Network error sending OTP', 'error');
    }
  };

  const handlePartnerVerifyOtp = async () => {
    if (!partnerLoginOtp) {
      showToast('Please enter OTP', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/partner/auth/login-otp-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: partnerLoginPhone, otp: partnerLoginOtp })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('fastnet_partner_session', data.session_token);
        setPartnerSessionToken(data.session_token);
        setCurrentUser(data.user);
        setPartnerData(data.partner);
        setActiveRole('partner');
        setPartnerAppTab('dashboard');
        loadPartnerAppData(data.session_token);
        showToast('Logged in successfully!', 'success');
      } else {
        showToast(data.error || 'Invalid OTP', 'error');
      }
    } catch (err) {
      showToast('Network error verifying OTP', 'error');
    }
  };

  const handlePartnerResetPasswordLanding = async () => {
    if (!partnerNewPasswordLanding) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (partnerNewPasswordLanding !== partnerConfirmPasswordLanding) {
      showToast('Passwords do not match', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/partner/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: partnerResetToken, new_password: partnerNewPasswordLanding })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password reset successfully. Please log in.', 'success');
        setPartnerResetToken('');
        setShowPartnerLogin(true);
      } else {
        showToast(data.error || 'Invalid or expired reset token', 'error');
      }
    } catch (err) {
      showToast('Error resetting password', 'error');
    }
  };

  const handlePartnerLogout = () => {
    localStorage.removeItem('fastnet_partner_session');
    setPartnerSessionToken('');
    setCurrentUser(null);
    setPartnerData(null);
    setActiveRole('marketing');
    showToast('Logged out of partner account.', 'info');
  };

  const handleFulfillRedemption = async () => {
    if (!selectedFulfillItem) return;
    try {
      const res = await fetch(`${API_BASE}/partner/redemption-approvals/${selectedFulfillItem.id}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerSessionToken}`
        },
        body: JSON.stringify({ partner_notes: fulfillNotes })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Redemption for ${selectedFulfillItem.customer_name} marked as fulfilled!`, 'success');
        setShowFulfillModal(false);
        setSelectedFulfillItem(null);
        setFulfillNotes('');
        fetchPartnerQueue();
        fetchPartnerDashboard();
        fetchPartnerNotifications();
      } else {
        showToast(data.error || 'Failed to fulfill redemption', 'error');
      }
    } catch (err) {
      showToast('Network error fulfilling redemption', 'error');
    }
  };

  const handleDisputeRedemption = async () => {
    if (!selectedDisputeItem) return;
    if (!disputeReasonText || disputeReasonText.trim().length < 10) {
      showToast('Dispute reason must be at least 10 characters', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/partner/redemption-approvals/${selectedDisputeItem.id}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerSessionToken}`
        },
        body: JSON.stringify({ reason: disputeReasonText })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Dispute submitted to admin.', 'success');
        setShowDisputeModal(false);
        setSelectedDisputeItem(null);
        setDisputeReasonText('');
        fetchPartnerQueue();
        fetchPartnerDashboard();
        setPartnerQueueSubTab('disputes');
      } else {
        showToast(data.error || 'Failed to submit dispute', 'error');
      }
    } catch (err) {
      showToast('Network error submitting dispute', 'error');
    }
  };

  const openAddPackageModal = () => {
    setEditingPkg(null);
    setPkgName('');
    setPkgDesc('');
    setPkgServiceType((partnerData?.service_types || ['CABLE'])[0]);
    setPkgFaceValue('');
    setPkgCostToPartner('');
    setPkgPointCost('');
    setPkgActiveRegions((partnerRegionsList || []).map(r => r.region_id));
    setShowPkgModal(true);
  };

  const openEditPackageModal = (pkg) => {
    setEditingPkg(pkg);
    setPkgName(pkg.name || '');
    setPkgDesc(pkg.description || '');
    setPkgServiceType(pkg.service_type || 'CABLE');
    setPkgFaceValue(pkg.face_value_rupees || '');
    setPkgCostToPartner(pkg.cost_to_partner_rupees || pkg.face_value_rupees || '');
    setPkgPointCost(pkg.point_cost || pkg.face_value_rupees || '');
    setPkgActiveRegions(pkg.active_regions || []);
    setShowPkgModal(true);
  };

  const handleSavePackage = async () => {
    if (!pkgName.trim() || !pkgFaceValue) {
      showToast('Package name and face value are required', 'error');
      return;
    }
    const payload = {
      name: pkgName,
      description: pkgDesc,
      service_type: pkgServiceType,
      face_value_rupees: Number(pkgFaceValue),
      cost_to_partner_rupees: Number(pkgCostToPartner || pkgFaceValue),
      point_cost: Number(pkgPointCost || pkgFaceValue),
      active_regions: pkgActiveRegions
    };
    try {
      const url = editingPkg
        ? `${API_BASE}/partner/packages/${editingPkg.id}`
        : `${API_BASE}/partner/packages`;
      const method = editingPkg ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerSessionToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(editingPkg ? 'Package updated!' : 'Package created!', 'success');
        setShowPkgModal(false);
        fetchPartnerPackages();
      } else {
        showToast(data.error || 'Failed to save package', 'error');
      }
    } catch (err) {
      showToast('Network error saving package', 'error');
    }
  };

  const handleTogglePackageActive = async (pkg) => {
    const endpoint = pkg.is_active ? 'deactivate' : 'reactivate';
    try {
      const res = await fetch(`${API_BASE}/partner/packages/${pkg.id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${partnerSessionToken}` }
      });
      if (res.ok) {
        showToast(`Package ${pkg.is_active ? 'deactivated' : 'reactivated'}!`, 'success');
        fetchPartnerPackages();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update package status', 'error');
      }
    } catch (err) {
      showToast('Error updating package status', 'error');
    }
  };

  const handleAddRegion = async () => {
    try {
      const res = await fetch(`${API_BASE}/partner/regions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerSessionToken}`
        },
        body: JSON.stringify({ region_id: newRegionId, service_type: newRegionServiceType })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Region mapping added!', 'success');
        setShowAddRegionModal(false);
        fetchPartnerRegions();
      } else {
        showToast(data.error || 'Failed to add region', 'error');
      }
    } catch (err) {
      showToast('Network error adding region', 'error');
    }
  };

  const handleDeactivateRegion = async (row, confirm = false) => {
    try {
      const res = await fetch(`${API_BASE}/partner/regions/${row.id}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerSessionToken}`
        },
        body: JSON.stringify({ confirm })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Region deactivated!', 'success');
        setDeactWarnModal(false);
        fetchPartnerRegions();
      } else if (res.status === 400 && data.requires_confirmation) {
        setDeactWarnRowId(row.id);
        setDeactWarnPackages(data.affected_packages || []);
        setDeactWarnModal(true);
      } else {
        showToast(data.error || 'Failed to deactivate region', 'error');
      }
    } catch (err) {
      showToast('Network error deactivating region', 'error');
    }
  };

  const handleReactivateRegion = async (row) => {
    try {
      const res = await fetch(`${API_BASE}/partner/regions/${row.id}/reactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${partnerSessionToken}` }
      });
      if (res.ok) {
        showToast('Region reactivated!', 'success');
        fetchPartnerRegions();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to reactivate region', 'error');
      }
    } catch (err) {
      showToast('Network error reactivating region', 'error');
    }
  };

  const handleDeleteRegion = async (row) => {
    try {
      const res = await fetch(`${API_BASE}/partner/regions/${row.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${partnerSessionToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Region removed!', 'success');
        fetchPartnerRegions();
      } else {
        showToast(data.error || 'Failed to remove region', 'error');
      }
    } catch (err) {
      showToast('Network error deleting region', 'error');
    }
  };

  const handleSavePartnerFeedback = async () => {
    if (!fbSubject.trim() || !fbDescription.trim()) {
      showToast('Subject and description are required', 'error');
      return;
    }
    if (fbDescription.trim().length < 20) {
      showToast('Description must be at least 20 characters', 'error');
      return;
    }
    const payload = {
      feedback_type: fbTypeRadio,
      redemption_approval_id: fbTypeRadio === 'REDEMPTION' ? fbRedemptionId : undefined,
      category: fbCategory,
      subject: fbSubject,
      description: fbDescription
    };
    try {
      const res = await fetch(`${API_BASE}/partner/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerSessionToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Feedback submitted to admin!', 'success');
        setShowNewFeedbackModal(false);
        setFbSubject('');
        setFbDescription('');
        fetchPartnerFeedback();
      } else {
        showToast(data.error || 'Failed to submit feedback', 'error');
      }
    } catch (err) {
      showToast('Network error submitting feedback', 'error');
    }
  };

  const handleSavePartnerProfile = async () => {
    const isPhoneChanged = pProfContactPhone !== initialContactPhone;
    if (isPhoneChanged && !confirmPhoneChangeCheck) {
      showToast('Please confirm phone number change by checking the checkbox', 'warning');
      return;
    }
    const payload = {
      display_name: pProfDisplayName,
      contact_phone: pProfContactPhone,
      contact_email: pProfContactEmail,
      address: pProfAddress,
      confirm_phone_change: isPhoneChanged ? confirmPhoneChangeCheck : false
    };
    try {
      const res = await fetch(`${API_BASE}/partner/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerSessionToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Partner profile updated successfully!', 'success');
        fetchPartnerProfile();
      } else {
        showToast(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Network error updating profile', 'error');
    }
  };

  const handleChangePartnerPassword = async () => {
    if (!pProfCurrentPass || !pProfNewPass) {
      showToast('Current and new password are required', 'error');
      return;
    }
    if (pProfNewPass !== pProfConfirmNewPass) {
      showToast('New passwords do not match', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/partner/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerSessionToken}`
        },
        body: JSON.stringify({ current_password: pProfCurrentPass, new_password: pProfNewPass })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password changed successfully!', 'success');
        setShowChangePasswordForm(false);
        setPProfCurrentPass('');
        setPProfNewPass('');
        setPProfConfirmNewPass('');
      } else {
        showToast(data.error || 'Failed to change password', 'error');
      }
    } catch (err) {
      showToast('Network error changing password', 'error');
    }
  };

  const handleMarkNotificationsRead = async (notification_ids, mark_all = false) => {
    try {
      const payload = mark_all ? { mark_all: true } : { notification_ids };
      const res = await fetch(`${API_BASE}/partner/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerSessionToken}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchPartnerNotifications();
      }
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const handleNotificationClick = (notif) => {
    handleMarkNotificationsRead([notif.id]);
    setShowNotifDropdown(false);
    if (notif.kind === 'REDEMPTION_APPROVED') {
      setPartnerAppTab('queue');
      setPartnerQueueSubTab('to_fulfill');
    } else if (notif.kind === 'DISPUTE_RESOLVED') {
      setPartnerAppTab('queue');
      setPartnerQueueSubTab('disputes');
    }
  };

  const renderPartnerAuthForm = () => {
    if (partnerResetToken) {
      return (
        <div className="card" style={{ maxWidth: '400px', margin: '2rem auto', padding: '1.5rem' }}>
          <h3>Set New Password</h3>
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label className="input-label">New Password</label>
            <input type="password" className="text-input" value={partnerNewPasswordLanding} onChange={e => setPartnerNewPasswordLanding(e.target.value)} />
          </div>
          <div className="input-group" style={{ marginTop: '0.75rem' }}>
            <label className="input-label">Confirm New Password</label>
            <input type="password" className="text-input" value={partnerConfirmPasswordLanding} onChange={e => setPartnerConfirmPasswordLanding(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handlePartnerResetPasswordLanding}>Set New Password</button>
        </div>
      );
    }

    return (
      <div className="card" style={{ maxWidth: '450px', margin: '2rem auto', padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Partner Login</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>FastNet Operator Hub</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button className={`btn ${partnerLoginTab === 'password' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => setPartnerLoginTab('password')}>
            Email + Password
          </button>
          <button className={`btn ${partnerLoginTab === 'otp' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => setPartnerLoginTab('otp')}>
            Phone + OTP
          </button>
        </div>

        {partnerLoginTab === 'password' ? (
          <>
            <div className="input-group">
              <label className="input-label">Partner Email</label>
              <input type="email" placeholder="partner@example.com" className="text-input" value={partnerLoginEmail} onChange={e => setPartnerLoginEmail(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginTop: '0.75rem' }}>
              <label className="input-label">Password</label>
              <input type="password" placeholder="••••••••" className="text-input" value={partnerLoginPassword} onChange={e => setPartnerLoginPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handlePartnerEmailLogin}>
              Log in
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowPartnerForgotForm(!showPartnerForgotForm)}>
                Forgot password?
              </button>
            </div>

            {showPartnerForgotForm && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Registered Email</label>
                <input type="email" placeholder="Enter email for reset link" className="text-input" style={{ fontSize: '0.75rem', margin: '0.35rem 0' }} value={partnerForgotEmail} onChange={e => setPartnerForgotEmail(e.target.value)} />
                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.75rem' }} onClick={handlePartnerForgotPassword}>
                  Send reset link
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {!partnerOtpSent ? (
              <>
                <div className="input-group">
                  <label className="input-label">Registered Phone Number</label>
                  <input type="tel" placeholder="10-digit mobile number" className="text-input" value={partnerLoginPhone} onChange={e => setPartnerLoginPhone(e.target.value.replace(/\D/g,''))} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handlePartnerSendOtp}>
                  Send One-Time Password
                </button>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">Enter OTP (Demo: 123456)</label>
                  <input type="text" placeholder="6-digit OTP" className="text-input" value={partnerLoginOtp} onChange={e => setPartnerLoginOtp(e.target.value)} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handlePartnerVerifyOtp}>
                  Verify
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem' }} onClick={() => setPartnerOtpSent(false)}>
                  Back
                </button>
              </>
            )}
          </>
        )}

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.25rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            {t("Are you a cable or broadband operator?", "क्या आप केबल या ब्रॉडबैंड ऑपरेटर हैं?", "আপনি কি কেবল বা ব্রডব্যান্ড অপারেটর?")}{' '}
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.75rem', fontWeight: 'bold' }}
              onClick={() => setActiveRole('marketing')}
            >
              {t("Apply to partner with us", "हमारे साथ पार्टनर बनने के लिए आवेदन करें", "আমাদের সাথে পার্টনার হওয়ার জন্য আবেদন করুন")}
            </button>
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            {t("Partner accounts are created by FastNet after your application is approved.", "आपकी अर्ज़ी मंज़ूर होने के बाद फास्टनेट द्वारा पार्टनर खाते बनाए जाते हैं।", "আপনার আবেদন অনুমোদিত হওয়ার পর ফাস্টনেট দ্বারা পার্টনার অ্যাকাউন্ট তৈরি করা হয়।")}
          </p>
        </div>
      </div>
    );
  };

  const renderPartnerView = () => {
    if (!currentUser || currentUser.role !== 'PARTNER_ADMIN') {
      return renderPartnerAuthForm();
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        {/* Perspective Banner */}
        <div className="perspective-banner">
          <span><Store size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} /> Partner Hub: {partnerData?.display_name || partnerData?.name || 'Partner Account'}</span>
        </div>

        <div className="phone-mockup" style={{ maxWidth: '600px', width: '100%' }}>
          <div className="phone-screen" style={{ minHeight: '550px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Welcome, {partnerData?.display_name || partnerData?.name}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{partnerData?.contact_email || partnerData?.contact_phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Notifications Bell */}
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                  <Bell size={20} style={{ color: unreadNotifCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }} />
                  {unreadNotifCount > 0 && (
                    <span style={{ position: 'absolute', top: '-4px', right: '-6px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '0.1rem 0.35rem', fontSize: '0.6rem', fontWeight: 'bold' }}>
                      {unreadNotifCount}
                    </span>
                  )}
                </div>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={handlePartnerLogout}>
                  <LogOut size={12} /> Log out
                </button>
              </div>
            </div>

            {/* Notifications Dropdown Modal / Popup */}
            {showNotifDropdown && (
              <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderBottom: '2px solid var(--primary)', fontSize: '0.8rem', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong>Notifications ({partnerNotifList.length})</strong>
                  <button className="btn btn-secondary" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} onClick={() => handleMarkNotificationsRead([], true)}>
                    Mark all as read
                  </button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {partnerNotifList.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      style={{ padding: '0.4rem', borderBottom: '1px dashed var(--border-color)', cursor: 'pointer', background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.1)' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{n.title} {!n.is_read && <span style={{ color: 'var(--danger)' }}>●</span>}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {n.body}
                        {(n.customer_phone || n.phone) && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <a href={`tel:${n.customer_phone || n.phone}`} className="btn btn-secondary" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                              📞 Call
                            </a>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'right' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                  {partnerNotifList.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>No notifications.</div>}
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
              
              {/* TAB 1: DASHBOARD */}
              {partnerAppTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Dashboard Overview</h4>
                    <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => fetchPartnerDashboard()}>
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>

                  {/* Row 1: Today */}
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Today</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{partnerDashData?.today?.redemptions_count || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Redemptions</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--success)' }}>{partnerDashData?.today?.fulfilled_count || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Fulfilled</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--warning)' }}>{partnerDashData?.today?.pending_count || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pending Action</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: This Month */}
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>This Month</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Redemptions / Fulfilled</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', marginTop: '0.2rem' }}>
                          {partnerDashData?.month?.redemptions_count || 0} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({partnerDashData?.month?.fulfilled_count || 0} fulfilled)</span>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Face Value Total</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.2rem' }}>₹{partnerDashData?.month?.face_value_total_rupees || 0}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Expected Payout</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)', marginTop: '0.2rem' }}>₹{partnerDashData?.month?.expected_payout_rupees || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Open Disputes */}
                  <div 
                    onClick={() => { setPartnerAppTab('queue'); setPartnerQueueSubTab('disputes'); }}
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--danger)' }}>Open Disputes</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Redemptions waiting on admin resolution</div>
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--danger)' }}>{partnerDashData?.disputes?.open_count || 0}</div>
                  </div>
                </div>
              )}

              {/* TAB 2: QUEUE */}
              {partnerAppTab === 'queue' && (
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button className={`btn ${partnerQueueSubTab === 'to_fulfill' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => setPartnerQueueSubTab('to_fulfill')}>
                      To Fulfill ({partnerQueueList.length})
                    </button>
                    <button className={`btn ${partnerQueueSubTab === 'disputes' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => setPartnerQueueSubTab('disputes')}>
                      Disputes ({partnerDisputesList.length})
                    </button>
                  </div>

                  {partnerQueueSubTab === 'to_fulfill' ? (
                    <div>
                      <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.4rem' }}>Customer</th>
                            <th style={{ padding: '0.4rem' }}>Package</th>
                            <th style={{ padding: '0.4rem' }}>Face Value</th>
                            <th style={{ padding: '0.4rem' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partnerQueueList.map(row => (
                            <tr key={row.id} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                              <td style={{ padding: '0.4rem' }}>
                                <div style={{ fontWeight: 'bold' }}>{row.customer_name}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{row.customer_phone}</div>
                              </td>
                              <td style={{ padding: '0.4rem' }}>{row.package_name}</td>
                              <td style={{ padding: '0.4rem', fontWeight: 'bold' }}>₹{row.face_value_rupees}</td>
                              <td style={{ padding: '0.4rem' }}>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button className="btn btn-primary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => { setSelectedFulfillItem(row); setShowFulfillModal(true); }}>
                                    Fulfill
                                  </button>
                                  <button className="btn btn-warning" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => { setSelectedDisputeItem(row); setShowDisputeModal(true); }}>
                                    Dispute
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {partnerQueueList.length === 0 && (
                            <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No approved redemptions to fulfill.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        <em>Note: Waiting on admin to resolve.</em>
                      </div>
                      <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.4rem' }}>Customer</th>
                            <th style={{ padding: '0.4rem' }}>Package</th>
                            <th style={{ padding: '0.4rem' }}>Reason</th>
                            <th style={{ padding: '0.4rem' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partnerDisputesList.map(row => (
                            <tr key={row.id} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                              <td style={{ padding: '0.4rem' }}>{row.customer_name}</td>
                              <td style={{ padding: '0.4rem' }}>{row.package_name}</td>
                              <td style={{ padding: '0.4rem', fontSize: '0.65rem' }}>{row.disputed_reason}</td>
                              <td style={{ padding: '0.4rem' }}><span className="badge badge-warning">DISPUTED</span></td>
                            </tr>
                          ))}
                          {partnerDisputesList.length === 0 && (
                            <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No open disputes.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PACKAGES */}
              {partnerAppTab === 'packages' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>My Packages</h4>
                    <button className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={openAddPackageModal}>
                      + Add Package
                    </button>
                  </div>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.4rem' }}>Name</th>
                        <th style={{ padding: '0.4rem' }}>Type</th>
                        <th style={{ padding: '0.4rem' }}>Value</th>
                        <th style={{ padding: '0.4rem' }}>Points</th>
                        <th style={{ padding: '0.4rem' }}>Status</th>
                        <th style={{ padding: '0.4rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerPackagesList.map(pkg => (
                        <tr key={pkg.id} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                          <td style={{ padding: '0.4rem', fontWeight: 'bold' }}>{pkg.name}</td>
                          <td style={{ padding: '0.4rem' }}><span className="badge badge-secondary">{pkg.service_type}</span></td>
                          <td style={{ padding: '0.4rem' }}>₹{pkg.face_value_rupees}</td>
                          <td style={{ padding: '0.4rem' }}>{pkg.point_cost} pts</td>
                          <td style={{ padding: '0.4rem' }}>
                            <span className={`badge ${pkg.is_active ? 'badge-success' : 'badge-danger'}`}>
                              {pkg.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '0.4rem' }}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button className="btn btn-secondary" style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }} onClick={() => openEditPackageModal(pkg)}>
                                Edit
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }} onClick={() => handleTogglePackageActive(pkg)}>
                                {pkg.is_active ? 'Deactivate' : 'Reactivate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {partnerPackagesList.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No packages configured.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: REGIONS */}
              {partnerAppTab === 'regions' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Service Regions</h4>
                    <button className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={() => setShowAddRegionModal(true)}>
                      + Add Region
                    </button>
                  </div>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.4rem' }}>Region</th>
                        <th style={{ padding: '0.4rem' }}>Type</th>
                        <th style={{ padding: '0.4rem' }}>Status</th>
                        <th style={{ padding: '0.4rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerRegionsList.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                          <td style={{ padding: '0.4rem' }}>
                            <div style={{ fontWeight: 'bold' }}>{r.region_name || r.region_id}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Code: {r.region_code || r.region_id}</div>
                          </td>
                          <td style={{ padding: '0.4rem' }}><span className="badge badge-secondary">{r.service_type}</span></td>
                          <td style={{ padding: '0.4rem' }}>
                            <span className={`badge ${r.is_active ? 'badge-success' : 'badge-danger'}`}>
                              {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '0.4rem' }}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {r.is_active ? (
                                <button className="btn btn-secondary" style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }} onClick={() => handleDeactivateRegion(r, false)}>
                                  Deactivate
                                </button>
                              ) : (
                                <button className="btn btn-secondary" style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }} onClick={() => handleReactivateRegion(r)}>
                                  Reactivate
                                </button>
                              )}
                              <button className="btn btn-danger" style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }} onClick={() => handleDeleteRegion(r)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {partnerRegionsList.length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No regions mapped.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 5: FEEDBACK */}
              {partnerAppTab === 'feedback' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Feedback &amp; Issues</h4>
                    <button className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={() => setShowNewFeedbackModal(true)}>
                      + New Feedback
                    </button>
                  </div>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.4rem' }}>Date</th>
                        <th style={{ padding: '0.4rem' }}>Category</th>
                        <th style={{ padding: '0.4rem' }}>Subject</th>
                        <th style={{ padding: '0.4rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerFeedbackList.map(fb => (
                        <tr key={fb.id} style={{ borderBottom: '1px dashed var(--border-color)', cursor: 'pointer' }} onClick={() => { setSelectedFeedbackDetail(fb); setShowFeedbackDetailModal(true); }}>
                          <td style={{ padding: '0.4rem', fontSize: '0.65rem' }}>{new Date(fb.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '0.4rem' }}><span className="badge badge-secondary">{fb.category}</span></td>
                          <td style={{ padding: '0.4rem', fontWeight: 'bold' }}>{fb.subject}</td>
                          <td style={{ padding: '0.4rem' }}>
                            <span className={`badge ${fb.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>
                              {fb.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {partnerFeedbackList.length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No feedback submitted.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 6: PROFILE */}
              {partnerAppTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Partner Profile</h4>

                  {/* Read-only info banner */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                    <div><strong>Legal Name:</strong> {partnerData?.legal_name}</div>
                    <div><strong>GST Number:</strong> {partnerData?.gst_number || 'N/A'}</div>
                    <div><strong>Services Offered:</strong> {(partnerData?.service_types || []).join(', ')}</div>
                  </div>

                  {/* Editable profile form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="input-group">
                      <label className="input-label">Display Name</label>
                      <input type="text" className="text-input" value={pProfDisplayName} onChange={e => setPProfDisplayName(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Contact Phone</label>
                      <input type="tel" className="text-input" value={pProfContactPhone} onChange={e => setPProfContactPhone(e.target.value)} />
                      {pProfContactPhone !== initialContactPhone && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.7rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <input type="checkbox" checked={confirmPhoneChangeCheck} onChange={e => setConfirmPhoneChangeCheck(e.target.checked)} />
                            Yes, I want to change my login phone number
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="input-group">
                      <label className="input-label">Contact Email</label>
                      <input type="email" className="text-input" value={pProfContactEmail} onChange={e => setPProfContactEmail(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Operating Address</label>
                      <input type="text" className="text-input" value={pProfAddress} onChange={e => setPProfAddress(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={handleSavePartnerProfile}>
                      Save Profile Changes
                    </button>
                  </div>

                  {/* Counts Panel */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{pProfCounts?.bound_customers || 0}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bound Customers</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{pProfCounts?.redemptions_all_time || 0}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>All-Time Redemptions</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--warning)' }}>{pProfCounts?.disputes_open || 0}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Open Disputes</div>
                    </div>
                  </div>

                  {/* Change Password Section */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    {!showChangePasswordForm ? (
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => setShowChangePasswordForm(true)}>
                        Change Password
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px' }}>
                        <h5 style={{ margin: 0 }}>Change Password</h5>
                        <div className="input-group">
                          <label className="input-label">Current Password</label>
                          <input type="password" className="text-input" value={pProfCurrentPass} onChange={e => setPProfCurrentPass(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">New Password</label>
                          <input type="password" className="text-input" value={pProfNewPass} onChange={e => setPProfNewPass(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Confirm New Password</label>
                          <input type="password" className="text-input" value={pProfConfirmNewPass} onChange={e => setPProfConfirmNewPass(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleChangePartnerPassword}>Set Password</button>
                          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowChangePasswordForm(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Nav Bar (6 Tabs) */}
            <div className="phone-bottom-nav" style={{ display: 'flex', justifyContent: 'space-around', padding: '0.5rem 0', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid var(--border-color)' }}>
              <button className={`phone-nav-btn ${partnerAppTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setPartnerAppTab('dashboard'); fetchPartnerDashboard(); }}>
                <BarChart2 size={16} />
                <span style={{ fontSize: '0.65rem' }}>Dashboard</span>
              </button>
              <button className={`phone-nav-btn ${partnerAppTab === 'queue' ? 'active' : ''}`} onClick={() => { setPartnerAppTab('queue'); fetchPartnerQueue(); }}>
                <Clock size={16} />
                <span style={{ fontSize: '0.65rem' }}>Queue</span>
              </button>
              <button className={`phone-nav-btn ${partnerAppTab === 'packages' ? 'active' : ''}`} onClick={() => { setPartnerAppTab('packages'); fetchPartnerPackages(); }}>
                <Package size={16} />
                <span style={{ fontSize: '0.65rem' }}>Packages</span>
              </button>
              <button className={`phone-nav-btn ${partnerAppTab === 'regions' ? 'active' : ''}`} onClick={() => { setPartnerAppTab('regions'); fetchPartnerRegions(); }}>
                <MapPin size={16} />
                <span style={{ fontSize: '0.65rem' }}>Regions</span>
              </button>
              <button className={`phone-nav-btn ${partnerAppTab === 'feedback' ? 'active' : ''}`} onClick={() => { setPartnerAppTab('feedback'); fetchPartnerFeedback(); }}>
                <MessageSquare size={16} />
                <span style={{ fontSize: '0.65rem' }}>Feedback</span>
              </button>
              <button className={`phone-nav-btn ${partnerAppTab === 'profile' ? 'active' : ''}`} onClick={() => { setPartnerAppTab('profile'); fetchPartnerProfile(); }}>
                <User size={16} />
                <span style={{ fontSize: '0.65rem' }}>Profile</span>
              </button>
            </div>

          </div>
        </div>

        {/* FULFILL MODAL */}
        {showFulfillModal && selectedFulfillItem && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <h4>Confirm Fulfillment</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Confirm you activated the <strong>{selectedFulfillItem.package_name}</strong> for <strong>{selectedFulfillItem.customer_name}</strong> ({selectedFulfillItem.customer_phone})?
              </p>
              <div className="input-group">
                <label className="input-label">Optional Partner Notes</label>
                <textarea className="text-input" placeholder="e.g. Account activated for July" value={fulfillNotes} onChange={e => setFulfillNotes(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleFulfillRedemption}>Confirm Fulfill</button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowFulfillModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* DISPUTE MODAL */}
        {showDisputeModal && selectedDisputeItem && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <h4>Dispute Redemption</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Disputing redemption for <strong>{selectedDisputeItem.customer_name}</strong>. Provide a reason for admin review (min 10 chars):
              </p>
              <div className="input-group">
                <label className="input-label">Dispute Reason *</label>
                <textarea className="text-input" placeholder="Reason for dispute (min 10 chars)..." value={disputeReasonText} onChange={e => setDisputeReasonText(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-warning" style={{ flex: 1 }} onClick={handleDisputeRedemption}>Submit Dispute</button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDisputeModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* PACKAGE MODAL */}
        {showPkgModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '480px' }}>
              <h4>{editingPkg ? 'Edit Package' : 'Add Package'}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                Packages are the rewards your customers can redeem with their loyalty points. Customers bound to you will see these in the app's Rewards section.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Package Name *</label>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>What customers will see. Example: '₹250 Cable Basic Monthly'.</div>
                  <input type="text" className="text-input" value={pkgName} onChange={e => setPkgName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>A short line about what's included. Optional.</div>
                  <textarea className="text-input" value={pkgDesc} onChange={e => setPkgDesc(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Service Type</label>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>Which of your services this package delivers.</div>
                  <select className="text-input" value={pkgServiceType} onChange={e => setPkgServiceType(e.target.value)}>
                    {(partnerData?.service_types || ['CABLE', 'BROADBAND']).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="input-group">
                    <label className="input-label">Face Value ₹ *</label>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>The rupee value the customer perceives. What you'd normally charge them for this.</div>
                    <input type="number" className="text-input" value={pkgFaceValue} onChange={e => setPkgFaceValue(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Cost to Partner ₹</label>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>Your actual cost to provide it. Used to calculate your platform payout. Defaults to Face Value if empty.</div>
                    <input type="number" className="text-input" value={pkgCostToPartner} onChange={e => setPkgCostToPartner(e.target.value)} placeholder={pkgFaceValue} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Point Cost *</label>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>How many loyalty points a customer must spend to redeem this. Usually 1 point = ₹1, so equal to Face Value.</div>
                  <input type="number" className="text-input" value={pkgPointCost} onChange={e => setPkgPointCost(e.target.value)} placeholder={pkgFaceValue} />
                </div>
                <div className="input-group">
                  <label className="input-label">Active Regions</label>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>Tick the regions where you'll fulfill this package. Customers outside these regions won't see it.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {(partnerRegionsList || []).filter(r => r.service_type === pkgServiceType).map(r => {
                      const rCode = r.region_id;
                      const checked = pkgActiveRegions.includes(rCode);
                      return (
                        <label key={r.id} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input 
                            type="checkbox" 
                            checked={checked} 
                            onChange={e => {
                              if (e.target.checked) setPkgActiveRegions(prev => [...prev, rCode]);
                              else setPkgActiveRegions(prev => prev.filter(c => c !== rCode));
                            }} 
                          />
                          {r.region_name || r.region_code || rCode} ({rCode})
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSavePackage}>Save Package</button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPkgModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ADD REGION MODAL */}
        {showAddRegionModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <h4>Add Service Region</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Region</label>
                  <select className="text-input" value={newRegionId} onChange={e => setNewRegionId(e.target.value)}>
                    {allSystemRegions.map(r => (
                      <option key={r.id} value={r.id}>{r.name || r.id} ({r.code || r.id})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Service Type</label>
                  <select className="text-input" value={newRegionServiceType} onChange={e => setNewRegionServiceType(e.target.value)}>
                    {(partnerData?.service_types || ['CABLE', 'BROADBAND']).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddRegion}>Add Region</button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddRegionModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* REGION DEACTIVATION WARNING MODAL */}
        {deactWarnModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <h4 style={{ color: 'var(--warning)' }}>Region Referenced in Packages</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Deactivating this region will also deactivate or update the following active packages:
              </p>
              <ul style={{ fontSize: '0.75rem', color: 'white', paddingLeft: '1.25rem' }}>
                {deactWarnPackages.map(p => <li key={p.id}>{p.name}</li>)}
              </ul>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-warning" style={{ flex: 1 }} onClick={() => handleDeactivateRegion({ id: deactWarnRowId }, true)}>
                  Confirm Deactivation
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeactWarnModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW FEEDBACK MODAL */}
        {showNewFeedbackModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
              <h4>Submit Feedback / Issue</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Type</label>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                    <label><input type="radio" name="fbType" value="GENERAL" checked={fbTypeRadio === 'GENERAL'} onChange={() => setFbTypeRadio('GENERAL')} /> General</label>
                    <label><input type="radio" name="fbType" value="REDEMPTION" checked={fbTypeRadio === 'REDEMPTION'} onChange={() => setFbTypeRadio('REDEMPTION')} /> About a Redemption</label>
                  </div>
                </div>
                {fbTypeRadio === 'REDEMPTION' && (
                  <div className="input-group">
                    <label className="input-label">Select Fulfilled Redemption</label>
                    <select className="text-input" value={fbRedemptionId} onChange={e => setFbRedemptionId(e.target.value)}>
                      <option value="">-- Select Redemption --</option>
                      {fbFulfilledRedemptions.map(r => (
                        <option key={r.id} value={r.id}>{r.customer_name} — {r.package_name} (₹{r.face_value_rupees})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select className="text-input" value={fbCategory} onChange={e => setFbCategory(e.target.value)}>
                    <option value="GENERAL">GENERAL</option>
                    <option value="CUSTOMER_ISSUE">CUSTOMER_ISSUE</option>
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="PAYMENT">PAYMENT</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Subject *</label>
                  <input type="text" className="text-input" value={fbSubject} onChange={e => setFbSubject(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Description (min 20 chars) *</label>
                  <textarea className="text-input" value={fbDescription} onChange={e => setFbDescription(e.target.value)} placeholder="Describe your feedback or issue..." />
                  <div style={{ fontSize: '0.65rem', color: fbDescription.length < 20 ? 'var(--warning)' : 'var(--success)', textAlign: 'right' }}>
                    {fbDescription.length} / 20 chars min
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSavePartnerFeedback}>Submit Feedback</button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowNewFeedbackModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK DETAIL MODAL */}
        {showFeedbackDetailModal && selectedFeedbackDetail && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
              <h4>Feedback Details</h4>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div><strong>Subject:</strong> {selectedFeedbackDetail.subject}</div>
                <div><strong>Category:</strong> <span className="badge badge-secondary">{selectedFeedbackDetail.category}</span></div>
                <div><strong>Status:</strong> <span className={`badge ${selectedFeedbackDetail.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>{selectedFeedbackDetail.status}</span></div>
                <div><strong>Description:</strong></div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{selectedFeedbackDetail.description}</div>
                {selectedFeedbackDetail.admin_notes && (
                  <>
                    <div><strong>Admin Notes:</strong></div>
                    <div style={{ background: 'rgba(99,102,241,0.1)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--primary)' }}>{selectedFeedbackDetail.admin_notes}</div>
                  </>
                )}
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setShowFeedbackDetailModal(false)}>Close</button>
            </div>
          </div>
        )}

      </div>
    );
  };

  // ----------------------------------------------------
  // 1. MARKETING / ONBOARDING LANDING PAGE
  // ----------------------------------------------------
  const renderMarketingView = () => {
    return (
      <div className="marketing-container">
        <div className="marketing-hero">
          <div className="badge badge-primary" style={{ alignSelf: 'center', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            Hyperlocal Supermarket Network
          </div>
          <h1>Your Neighborhood Grocery Shop, <span className="gradient-text">Subsidized by FastNet</span></h1>
          <p>
            Welcome to the FastNet Marketplace! Shop for fresh produce and daily essentials from your favorite local grocery stores. Every purchase automatically earns points that discount your broadband or cable TV bill.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button className="btn" onClick={() => switchViewToRole('customer')}>Shop Groceries Now</button>
            <button className="btn btn-secondary" onClick={() => switchViewToRole('admin')}>Open Admin Console</button>
          </div>
        </div>

        <div className="marketing-grid">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <ShoppingBag size={24} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Support Local Stores</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Buy fresh groceries, vegetables, and daily staples from approved local shopkeepers in your immediate neighborhood.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
              <Sparkles size={24} style={{ color: 'var(--secondary)', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>ISP loyalty bonus</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Your local shopping commission converts into loyalty points. Use them to redeem WiFi boosters, speed upgrades, or cable channel packs!
              </p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <ShieldAlert size={24} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Offline Tolerance</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Built specifically for semi-urban or rural connectivity. Place orders and manage store inventory offline; changes sync when the signal returns.
            </p>
          </div>
        </div>

        {/* Collapsible B2B Retention Calculator (De-emphasized for the pilot stockist/wholesaler audience) */}
        <div className="glass-card" style={{ background: 'var(--bg-surface)', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '1rem' }}>
          <div 
            onClick={() => setCalculatorCollapsed(!calculatorCollapsed)} 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calculator size={22} style={{ color: 'var(--primary)' }} />
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0 }}>Business Retention Calculator</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Churn reduction & commission estimate tool for ISP Operators</p>
              </div>
            </div>
            <button className="badge badge-primary" style={{ border: 'none', cursor: 'pointer', padding: '0.4rem 0.8rem', textTransform: 'none' }}>
              {calculatorCollapsed ? "Expand Calculator +" : "Collapse Calculator -"}
            </button>
          </div>

          {!calculatorCollapsed && (
            <div className="calc-section" style={{ marginTop: '1.5rem', border: 'none', background: 'transparent', padding: 0 }}>
              <div className="calc-inputs">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Calculate Retention Benefits</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  See how opening a hyperlocal daily-needs grocery channel increases operator profitability and loyalty.
                </p>
                
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'between' }}>
                    <span className="input-label">Active ISP Customers</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginLeft: 'auto' }}>{calcCustomers.toLocaleString()}</span>
                  </div>
                  <input type="range" min={5000} max={100000} step={5000} value={calcCustomers} onChange={e => setCalcCustomers(parseInt(e.target.value))} />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'between' }}>
                    <span className="input-label">Avg. {t('Monthly', 'मासिक', 'মাসিক')} Broadband Bill</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginLeft: 'auto' }}>₹{calcBill}</span>
                  </div>
                  <input type="range" min={300} max={1500} step={50} value={calcBill} onChange={e => setCalcBill(parseInt(e.target.value))} />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'between' }}>
                    <span className="input-label">Avg. Marketplace Spend / Customer</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginLeft: 'auto' }}>₹{calcMarketplace}</span>
                  </div>
                  <input type="range" min={500} max={5000} step={100} value={calcMarketplace} onChange={e => setCalcMarketplace(parseInt(e.target.value))} />
                </div>
              </div>

              <div className="calc-outputs">
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Commisions Retained</p>
                  <div className="calc-val">₹{((calcCustomers * calcMarketplace * 0.10)).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Per Month (Assuming 10% average commission rate)</p>
                </div>
                <hr style={{ borderColor: 'var(--border-color)' }} />
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Loyalty Points Credited</p>
                  <div className="calc-val" style={{ color: 'var(--primary)' }}>{((calcCustomers * (calcMarketplace * 0.18) * 0.45)).toLocaleString(undefined, {maximumFractionDigits: 0})} pts</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Directly subsidizing customer broadband bills monthly</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Are you a cable/internet operator?</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Partner with FastNet Hyperlocal and turn your subscriber base into a local marketplace. Leave your details and we'll get in touch.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '400px', margin: '0 auto' }}>
            <input 
              type="text" 
              placeholder="Operator/Company name" 
              className="text-input" 
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Phone" 
              className="text-input" 
              value={partnerPhone}
              onChange={(e) => setPartnerPhone(e.target.value)}
            />
            <button className="btn" onClick={handlePartnerSubmit}>Get in touch</button>
          </div>
        </div>
      </div>
    );
  };

  const handleStartNewOrder = async (targetShopId, productName) => {
    try {
      const targetStockist = customerStockists.find(s => s.id === targetShopId);
      if (!targetStockist) return;
      setSelectedStockist(targetStockist);
      
      const res = await fetch(`${API_BASE}/products?regionId=${currentUser.region_id}&stockistId=${targetStockist.id}`);
      if (!res.ok) return;
      const currentProds = await res.json();
      
      const targetProd = currentProds.find(p => p.name.toLowerCase().includes(productName.toLowerCase()));
      if (targetProd && targetProd.stock_qty > 0) {
        setCustomerCart([{ product: targetProd, quantity: 1, stockistId: targetStockist.id, stockistName: targetStockist.name }]);
        showToast(`Started new order at ${targetStockist.name} with ${targetProd.name}!`, 'success');
      } else {
        showToast(`Item is currently out of stock at ${targetStockist.name}`, 'warning');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const AlternativeShops = ({ productName, regionId, excludeStockistId }) => {
    const [alts, setAlts] = useState([]);
    useEffect(() => {
      fetch(`${API_BASE}/products/search-alternatives?name=${encodeURIComponent(productName)}&regionId=${regionId}&excludeStockistId=${excludeStockistId}`)
        .then(res => res.json())
        .then(data => setAlts(data))
        .catch(err => console.error(err));
    }, [productName, regionId, excludeStockistId]);

    if (alts.length === 0) return null;

    return (
      <div style={{ marginTop: '0.4rem', fontSize: '0.65rem', background: 'rgba(245,158,11,0.08)', border: '1px dashed var(--warning)', borderRadius: '6px', padding: '0.35rem', width: '100%' }}>
        <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>Also available at:</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
          {alts.map(alt => (
            <div key={alt.shopId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>{alt.shopName} (₹{alt.price})</span>
              <button 
                className="badge badge-warning" 
                style={{ border: 'none', cursor: 'pointer', fontSize: '0.55rem', padding: '0.1rem 0.3rem' }}
                onClick={() => handleStartNewOrder(alt.shopId, productName)}
              >
                Order Here
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 2. CUSTOMER MOBILE APP SIMULATOR
  // ----------------------------------------------------
  const renderCustomerView = () => {
    const isLoggedOut = !currentUser || currentUser.role !== 'CUSTOMER';
    const activeRegionName = currentUser ? (regions.find(r => r.id === currentUser.region_id)?.name || 'Kolkata South (Garia)') : 'Kolkata South (Garia)';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        <div className="perspective-banner">
          <span><UserCheck size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} /> {t('Customer View', 'कस्टमर व्यू', 'গ্রাহক মোড')}: {isLoggedOut ? t('Not logged in', 'লগইন করা নেই', 'লগইন করা নেই') : `${currentUser.name} (${activeRegionName})`}</span>
        </div>
        
        <div className="phone-mockup">
          <div className="phone-notch"></div>
          <div className="phone-screen">
            {/* Language Selector Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                <Languages size={12} />
                <span>Language:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button 
                  onClick={() => setLang('en')} 
                  style={{ background: lang === 'en' ? 'var(--primary)' : 'none', border: 'none', color: 'white', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: lang === 'en' ? 'bold' : 'normal' }}
                >
                  English
                </button>
                <button 
                  onClick={() => setLang('hi')} 
                  style={{ background: lang === 'hi' ? 'var(--primary)' : 'none', border: 'none', color: 'white', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: lang === 'hi' ? 'bold' : 'normal' }}
                >
                  हिंदी
                </button>
                <button 
                  onClick={() => setLang('bn')} 
                  style={{ background: lang === 'bn' ? 'var(--primary)' : 'none', border: 'none', color: 'white', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: lang === 'bn' ? 'bold' : 'normal' }}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {isLoggedOut ? (
              <>
                <div className="phone-header">
                  <span>FastNet 5G</span>
                  <span><Signal size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /><Battery size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> 19:43</span>
                </div>
                {/* Localized Auth Form */}
                {renderAuthForm('customer')}
              </>
            ) : (
              <>
                {/* Simulated Phone Status Bar */}
                <div className="phone-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>FastNet 5G</span>
                    <span className="badge badge-success" style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>{formatPoints(customerBalance)}</span>
                  </div>
                  <span><Signal size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /><Battery size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> 19:43</span>
                </div>

                {checkoutResult && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.97)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '1.25rem', overflowY: 'auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
                      <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                        <CheckCircle2 size={36} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'white' }}>{t('Order Placed', 'ऑर्डर सफल हुआ', 'অর্ডার সফল হয়েছে')}</h3>
                    </div>

                    {/* Fulfillment Setup Block for placed orders */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>{t('Fulfillment Settings', 'फ़ुलफ़िलमेंट सेटिंग्स', 'ফুলফিলমেন্ট সেটিংস')}</h4>
                      {checkoutResult.orders.map(o => {
                        const isPrepElapsed = prepElapsedOrders.includes(o.id);
                        return (
                          <div key={o.id} style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.75rem' }}>
                              <span>{o.stockist_name}</span>
                              <span style={{ color: 'var(--accent)' }}>#{o.id.substring(2).toUpperCase()}</span>
                            </div>
                            
                            {o.fulfillment_type === 'PICKUP' ? (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t('Status: Take Away (Pickup)', 'स्थिति: टेक अवे (पिकअप)', 'অবস্থা: টেক অ্যাওয়ে (পিকআপ)')}</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{t('Scheduled Pickup Slot:', 'निर्धारित पिकअप स्लॉट:', 'নির্ধারিত পিকআপ স্লট:')} </span>
                                  <strong style={{ color: 'white' }}>{formatPickupSlotDisplay(o.pickup_slot) || t('Not set', 'निर्धारित नहीं', 'নির্ধারিত নেই')}</strong>
                                </div>
                                <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed var(--primary)', borderRadius: '6px', padding: '0.4rem', marginTop: '0.4rem', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}><Key size={10} style={{ display: 'inline', marginRight: '0.2rem', verticalAlign: 'middle' }} /> {t('Verification PIN:', 'सत्यापन पिन:', 'পিকআপ কোড:')}</span>
                                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '0.15em' }}>{o.pickup_pin || '1234'}</div>
                                </div>

                                                                  <button 
                                    className="btn" 
                                    style={{ width: '100%', padding: '0.3rem', fontSize: '0.65rem', marginTop: '0.5rem', background: 'rgba(236,72,153,0.1)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }}
                                    onClick={() => triggerConfirmModal(
                                      t('Switch to Delivery', 'डिलिवरी पर स्विच करें', 'ডেলিভারিতে পরিবর্তন করুন'),
                                      t('Are you sure you want to switch to delivery? A delivery fee of ₹40 (or ₹30 for Rural) will be added to your order.', 'क्या आप डिलीवरी पर स्विच करना चाहते हैं? आपके ऑर्डर में ₹40 (ग्रामीण के लिए ₹30) का डिलीवरी शुल्क जोड़ा जाएगा।', 'আপনি কি নিশ্চিত যে আপনি ডেলিভারিতে পরিবর্তন করতে চান? আপনার অর্ডারে ₹৪০ (গ্রামীণ এলাকার জন্য ₹৩০) ডেলিভারি ফি যোগ করা হবে।'),
                                      () => handleSwitchToDelivery(o.id),
                                      false,
                                      t('Yes, Switch', 'हाँ, स्विच करें', 'হ্যাঁ, পরিবর্তন করুন'),
                                      t('No', 'नहीं', 'না')
                                    )}
                                  >
                                    {t('Switch to Delivery', 'डिलिवरी पर स्विच करें', 'ডেলিভারি মোডে যান')} (+₹{o.region_id === 'r2' ? 30 : 40})
                                  </button>
                              </div>
                            ) : (
                              <div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Truck size={12} /> {t('Mode: DELIVERY', 'डिलिवरी मोड', 'ডেলিভারি মোড')}
                                </span>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{t('Shipping charges applied. Cannot switch back to pickup.', 'डिलिवरी शुल्क लागू। अब पिकअप पर वापस नहीं जा सकते।', 'ডেলিভারি চার্জ যুক্ত হয়েছে। পিকআপে ফিরে যাওয়া সম্ভব নয়।')}</p>
                              </div>
                            )}

                            {renderCancelButtonOrClosed(o)}

                            {/* Transparent Points Breakdown Receipt */}
                            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '0.65rem', padding: '0.35rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                                onClick={() => toggleBreakdown(o.id)}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                                  {t('Show Points Breakdown', 'पॉइंट्स विवरण दिखाएं', 'পয়েন্টের হিসাব দেখান')}
                                </span>
                                {expandedBreakdownOrders.has(o.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                              
                              {expandedBreakdownOrders.has(o.id) && (
                                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.05)', marginTop: '0.15rem' }}>
                                  <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                                    {t('Point Breakdown', 'पॉइंट्स विवरण', 'পয়েন্ট হিসাব')}
                                  </div>
                                  <div style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                                    {o.margin && o.earnRatePercent ? (
                                      t(
                                        `You earned ${o.pointsCredited || o.points_credited || 0} pts from ${o.stockist_name || 'Store'} — this order's margin was ₹${o.margin} at your ${o.earnRatePercent}% rate.`,
                                        `आपने ${o.stockist_name || 'Store'} से ${o.pointsCredited || o.points_credited || 0} pts कमाए हैं — इस ऑर्डर का मुनाफा ₹${o.margin} व आपकी दर ${o.earnRatePercent}% थी।`,
                                        `আপনি ${o.stockist_name || 'Store'} থেকে ${o.pointsCredited || o.points_credited || 0} pts পেয়েছেন — এই অর্ডারে লাভ ছিল ₹${o.margin} ও আপনার হার ${o.earnRatePercent}% ছিল।`
                                      )
                                    ) : (
                                      t(
                                        `You earned ${o.pointsCredited || o.points_credited || 0} pts from ${o.stockist_name || 'Store'}.`,
                                        `आपने ${o.stockist_name || 'Store'} से ${o.pointsCredited || o.points_credited || 0} pts कमाए हैं।`,
                                        `আপনি ${o.stockist_name || 'Store'} থেকে ${o.pointsCredited || o.points_credited || 0} pts পেয়েছেন।`
                                      )
                                    )}</div>
                                </div>
                              )}
                            </div>

                            {/* WhatsApp Notification Share Trigger (§B1) */}
                            <button 
                              className="btn btn-secondary" 
                              style={{ width: '100%', padding: '0.35rem', fontSize: '0.65rem', marginTop: '0.35rem', background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                              onClick={() => {
                                setSimulatedWaMessage({
                                  orderId: o.id,
                                  customerName: currentUser.name,
                                  stockistName: o.stockist_name,
                                  totalPrice: o.total_price,
                                  pickupPin: o.pickup_pin,
                                  points: o.pointsCredited || o.points_credited || 0,
                                  subtotal: o.subtotal,
                                  fulfillmentType: o.fulfillment_type
                                });
                              }}
                            >
                              <MessageSquare size={12} /> {t('Preview WhatsApp Notification', 'व्हाट्सएप सूचना का पूर्वावलोकन', 'হোয়াটসঅ্যাপ নোটিফিকেশন প্রিভিউ')}
                            </button>

                          </div>
                        );
                      })}
                    </div>

                    <button className="btn btn-accent" style={{ marginTop: 'auto' }} onClick={() => { setCheckoutResult(null); loadCustomerData(); }}>
                      {t('Done & Continue Shopping', 'पूर्ण और खरीदारी जारी रखें', 'সম্পন্ন ও বাজার করা চালিয়ে যান')}
                    </button>
                  </div>
                )}

                {/* Simulated WhatsApp Mockup Overlay */}
                {simulatedWaMessage && (
                  <div style={{ position: 'absolute', inset: 0, background: '#0b141a', zIndex: 110, display: 'flex', flexDirection: 'column' }}>
                    {/* WhatsApp Header */}
                    <div style={{ background: '#128c7e', padding: '0.75rem 0.5rem 0.5rem 0.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setSimulatedWaMessage(null)}
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#128c7e', fontWeight: 'bold', fontSize: '0.75rem' }}>
                        FN
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>FastNet Updates</span>
                        <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>online</span>
                      </div>
                    </div>

                    {/* Chat Body */}
                    <div style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto', background: '#0b141a', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ alignSelf: 'center', background: '#182229', color: '#8696a0', padding: '0.2' + 'rem 0.4' + 'rem', borderRadius: '4px', fontSize: '0.55rem', textTransform: 'uppercase' }}>
                        Today
                      </div>
                      
                      {/* Message Bubble */}
                      <div style={{ alignSelf: 'flex-start', background: '#202c33', color: '#e9edef', padding: '0.5rem 0.75rem', borderRadius: '0 8px 8px 8px', maxWidth: '85%', fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span style={{ color: '#25d366', fontWeight: 'bold', fontSize: '0.65rem' }}>FastNet Supermarket</span>
                        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                          {`Hello ${simulatedWaMessage.customerName || 'Valued Customer'}!\n\nYour FastNet Supermarket order is confirmed at *${simulatedWaMessage.stockistName}*.\n\n*Order ID:* #${simulatedWaMessage.orderId.substring(2).toUpperCase()}\n*Total Price:* ₹${simulatedWaMessage.totalPrice}\n*Subtotal:* ₹${simulatedWaMessage.subtotal}\n*Rewards Earned:* +${simulatedWaMessage.points} pts\n\n${
                            simulatedWaMessage.fulfillmentType === 'PICKUP'
                              ? `*Fulfillment:* Store Pickup\n*Verification PIN:* ${simulatedWaMessage.pickupPin || '1234'}\n\nPlease share this PIN with the shopkeeper when picking up your items.`
                              : `*Fulfillment:* Home Delivery\n\nYour order will be delivered to your registered address shortly.`
                          }\n\nThank you for choosing FastNet!`}
                        </p>
                        <span style={{ alignSelf: 'flex-end', fontSize: '0.5rem', color: '#8696a0', marginTop: '0.2rem' }}>19:43 <CheckCheck size={10} style={{ display: 'inline', color: '#53bdeb' }} /></span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ padding: '0.5rem 0.75rem', background: '#1f2c34', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                        onClick={() => setSimulatedWaMessage(null)}
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                )}

                {/* §H: One-way delivery switch confirmation overlay */}
                {deliverySwitchConfirm && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                        <AlertTriangle size={20} />
                        <h3 style={{ fontSize: '1rem', color: 'white', margin: 0 }}>{t('Switch to Home Delivery?', 'होम डिलीवरी पर स्विच?', 'হোম ডেলিভারিতে যাবেন?')}</h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {t('This is a one-way switch. Once switched to delivery, you cannot return to store pickup. Delivery fee will be added to your order.',
                           'यह एकतरफा बदलाव है। एक बार डिलीवरी में स्विच करने पर पिकअप पर वापस नहीं जा सकते। डिलीवरी शुल्क जुड़ जाएगा।',
                           'এটি একমুখী পরিবর্তন। একবার ডেলিভারিতে গেলে পিকআপে ফেরা যাবে না। ডেলিভারি চার্জ যোগ হবে।')}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeliverySwitchConfirm(null)}>
                          {t('Cancel', 'रद्द करें', 'বাতিল')}
                        </button>
                        <button className="btn btn-accent" style={{ flex: 1 }} onClick={() => handleSwitchToDeliveryConfirmed(deliverySwitchConfirm)}>
                          <Truck size={14} /> {t('Confirm Switch', 'स्विच की पुष्टि करें', 'পরিবর্তন নিশ্চিত করুন')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* §F19: No-show Alert overlay */}
                {noShowAlert && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                        <AlertTriangle size={20} />
                        <h3 style={{ fontSize: '1rem', color: 'white', margin: 0 }}>{t('Missed Pickup?', 'पिकअप छूट गया?', 'পিকআপ মিস হয়েছে?')}</h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {t('If you missed your pickup slot, you can reschedule once (free) or cancel for a refund.',
                           'यदि आप अपना पिकअप स्लॉट चूक गए, तो आप एक बार पुनः निर्धारण कर सकते हैं (निःशुल्क) या रिफंड के लिए रद्द कर सकते हैं।',
                           'যদি পিকআপ স্লট মিস করেন, একবার বিনামূল্যে পুনর্নির্ধারণ করতে পারবেন অথবা ফেরতের জন্য বাতিল করুন।')}
                      </p>
                      <div className="input-group">
                        <label className="input-label">{t('New Pickup Slot', 'नया पिकअप समय', 'নতুন পিকআপ সময়')}</label>
                        <select className="text-input" value={rescheduleSlot} onChange={e => setRescheduleSlot(e.target.value)}>
                          <option value="">{t('-- Select slot --', '-- स्लॉट चुनें --', '-- স্লট বেছে নিন --')}</option>
                          {(() => {
                            const ord = (customerOrders || []).find(o => o.id === noShowAlert.orderId);
                            const stockist = customerStockists.find(s => s.id === (ord?.stockist_id)) || { opening_time: '08:00', closing_time: '20:00', prep_eta_minutes: 10 };
                            const SLOTS = getAvailableSlots(stockist);
                            return SLOTS.map(slot => (
                              <option key={slot.value} value={slot.value}>{slot.label}</option>
                            ));
                          })()}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button className="btn btn-accent" onClick={() => { if (!rescheduleSlot) { showToast('Pick a slot first', 'error'); return; } handleNoShowAction(noShowAlert.orderId, 'RESCHEDULE', rescheduleSlot); }}>
                          <RefreshCw size={14} /> {t('Reschedule Pickup (once free)', 'पिकअप पुनः निर्धारित करें (एक बार मुफ्त)', 'পুনরায় পিকআপ (একবার বিনামূল্যে)')}
                        </button>
                        <button className="btn btn-danger" onClick={() => handleNoShowAction(noShowAlert.orderId, 'CANCEL')}>
                          <Ban size={14} /> {t('Cancel & Get Refund', 'रद्द करें और रिफंड पाएं', 'বাতিল করুন ও ফেরত পান')}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setNoShowAlert(null)}>
                          {t('Dismiss', 'बंद करें', 'বন্ধ করুন')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inner Content based on App Tab */}
                <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                  
                  {/* Top Customer info bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DELIVERING TO (ডেলিভারি ঠিকানা)</p>
                      <h4 style={{ fontSize: '0.85rem', color: 'white' }}>{currentUser.name} ({activeRegionName})</h4>
                    </div>
                    <button onClick={handleLogout} className="badge badge-danger" style={{ border: 'none', cursor: 'pointer' }}>Logout</button>
                  </div>

                  {customerAppTab === 'store' && (
                    <>
                      {/* Shop Selection discovery cards */}
                      {!selectedStockist ? (
                        <div>
                          {(() => {
                            const prevStockistObj = previousStockistId ? customerStockists.find(s => s.id === previousStockistId) : null;
                            return (
                              <>
                                {prevStockistObj && (
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ marginBottom: '0.75rem', width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', borderColor: 'var(--accent)', background: 'rgba(99, 102, 241, 0.12)' }}
                                    onClick={() => {
                                      setSelectedStockist(prevStockistObj);
                                      setPreviousStockistId(null);
                                    }}
                                  >
                                    <ArrowLeft size={14} /> {t('Continue shopping at', 'यहाँ खरीदारी जारी रखें:', 'এখানে কেনাকাটা চালিয়ে যান:')} {prevStockistObj.name}
                                  </button>
                                )}
                                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{t('Select Local Grocery Store', 'स्थानीय किराना दुकान चुनें', 'স্থানীয় মুদি দোকান বেছে নিন')}</h3>
                              </>
                            );
                          })()}

                          {/* Shop search box */}
                          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                            <input 
                              type="text" 
                              className="text-input" 
                              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem 0.4rem 2rem', width: '100%' }}
                              placeholder={t('Search shops by name...', 'नाम से दुकानें खोजें...', 'নাম দিয়ে দোকান খুঁজুন...')}
                              value={shopSearchQuery}
                              onChange={e => setShopSearchQuery(e.target.value)}
                            />
                            <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {customerStockists
                              .filter(s => s.name.toLowerCase().includes(shopSearchQuery.toLowerCase()))
                              .map(s => {
                                const isOpen = (() => {
                                  if (!s.opening_time || !s.closing_time) return true;
                                  const now = new Date();
                                  const curMins = now.getHours() * 60 + now.getMinutes();
                                  const [opH, opM] = s.opening_time.split(':').map(Number);
                                  const [clH, clM] = s.closing_time.split(':').map(Number);
                                  return curMins >= (opH * 60 + opM) && curMins <= (clH * 60 + clM);
                                })();

                                const productCountLabel = (s.product_count !== undefined && s.product_count === 0)
                                  ? t('No items listed yet', 'अभी कोई उत्पाद सूचीबद्ध नहीं', 'এখনও কোনো পণ্য তালিকাভুক্ত নয়')
                                  : `${s.product_count || 0} ${t('items', 'सामान', 'টি পণ্য')}`;

                                return (
                                  <div key={s.id} className="glass-card" style={{ padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h4 style={{ fontSize: '0.85rem', color: 'white', margin: 0 }}>{s.name}</h4>
                                        <span className={`badge ${isOpen ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.55rem', padding: '0.05rem 0.3rem' }}>
                                          {isOpen ? t('Open', 'खुला', 'খোলা') : t('Closed', 'बंद', 'বন্ধ')}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {s.rating ? (
                                          <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 'bold' }}>
                                            ⭐ {s.rating} ({s.ratings_count || 0})
                                          </span>
                                        ) : null}
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                          {productCountLabel}
                                        </span>
                                        {s.delivery_radius_km && (
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            • {s.delivery_radius_km}km radius
                                          </span>
                                        )}
                                        {s.min_order_amount && (
                                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            • Min ₹{s.min_order_amount}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button className="btn btn-accent" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={() => { setSelectedStockist(s); setPreviousStockistId(null); }}>
                                      {t('Shop', 'खरीदारी करें', 'বাজার করুন')}
                                    </button>
                                  </div>
                                );
                              })}
                            {customerStockists.length === 0 && (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
                                {t("No shops are open in your area yet. We're onboarding local stores — please check back soon.",
                                   "आपके क्षेत्र में अभी कोई दुकान खुली नहीं है। हम स्थानीय दुकानों को जोड़ रहे हैं — कृपया जल्द ही वापस जांचें।",
                                   "আপনার এলাকায় এখনও কোনো দোকান খোলা নেই। আমরা স্থানীয় দোকান অন্তর্ভুক্ত করছি — অনুগ্রহ করে শীঘ্রই আবার দেখুন।")}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} 
                              onClick={() => {
                                if (selectedStockist) {
                                  setPreviousStockistId(selectedStockist.id);
                                }
                                setSelectedStockist(null);
                              }}
                            >
                              ← Other Shops
                            </button>
                            <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: 'bold' }}>{selectedStockist.name}</span>
                          </div>

                          {/* Search bar for customer app catalog */}
                          <div style={{ position: 'relative', margin: '0.5rem 0' }}>
                            <input 
                              type="text" 
                              className="text-input" 
                              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem 0.4rem 2rem', width: '100%' }}
                              placeholder={t('Search products...', 'उत्पाद खोजें...', 'পণ্য খুঁজুন...')}
                              value={customerSearch}
                              onChange={e => setCustomerSearch(e.target.value)}
                            />
                            <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          </div>

                          {/* Catalog List */}
                          <h3 style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>{t('Popular Staples', 'लोकप्रिय स्टेपल्स', 'রোজকার বাজার')}</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {customerProducts.filter(p => p.name.toLowerCase().includes(customerSearch.toLowerCase())).map(p => {
                              const rate = getPointsRate(selectedStockist.id, currentUser.region_id);
                              const earnEst = Math.round((p.price - p.cost_price) * (rate / 100) * 100) / 100;
                              const isOutOfStock = p.stock_qty <= 0;
                              return (
                                <div key={p.id} className="netflix-card" style={{ display: 'flex', flexDirection: 'column', padding: '0.6rem', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: '100%' }}>
                                    <img src={p.image_url} alt={p.name} style={{ width: '56px', height: '56px', borderRadius: '6px', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                      <h4 style={{ fontSize: '0.75rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                          {p.name}
                                          {p.has_flagged_bill && (
                                            <AlertTriangle size={12} style={{ color: 'var(--danger)' }} title="This product has a flagged bill photo under review by admin." />
                                          )}
                                        </h4>
                                        <button 
                                          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.6rem', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block', marginTop: '0.1rem' }}
                                          onClick={() => {
                                            setCustomerProvenanceProduct(p);
                                            fetch(`${API_BASE}/products/${p.id}/bill-history`)
                                              .then(res => res.json())
                                              .then(data => setCustomerProvenanceHistory(data));
                                          }}
                                        >
                                          View price provenance
                                        </button>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>₹{p.price}</span>
                                        <span className="badge badge-success" style={{ fontSize: '0.55rem', padding: '0.1rem 0.25rem' }}>
                                          Earn {formatPoints(earnEst)}
                                        </span>
                                      </div>
                                    </div>
                                    <button 
                                      className="btn btn-accent" 
                                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', height: '28px', background: isOutOfStock ? 'rgba(255,255,255,0.05)' : '', color: isOutOfStock ? 'var(--text-muted)' : '', border: isOutOfStock ? '1px solid rgba(255,255,255,0.05)' : '' }}
                                      disabled={isOutOfStock}
                                      onClick={() => addToCart(p)}
                                    >
                                      {isOutOfStock ? t('Out of Stock', 'स्टॉक में नहीं है', 'স্টকে নেই') : <><Plus size={12} /> {t('Add', 'जोड़ें', 'যুক্ত করুন')}</>}
                                    </button>
                                  </div>
                                  {isOutOfStock && (
                                    <AlternativeShops productName={p.name} regionId={currentUser.region_id} excludeStockistId={selectedStockist.id} />
                                  )}
                                </div>
                              );
                            })}
                            {customerProducts.filter(p => p.name.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>{t('No products found', 'कोई उत्पाद नहीं मिला', 'কোনো পণ্য পাওয়া যায়নি')}</p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Floating Unified Cart Panel */}
                      {customerCart.length > 0 && (
                        <div style={{ position: 'sticky', bottom: '0', background: 'var(--bg-surface-elevated)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: 'auto', boxShadow: '0 -5px 15px rgba(0,0,0,0.5)', zIndex: 50 }}>
                          
                          {/* Segment Picker for Pickup/Delivery */}
                          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem', gap: '0.2rem' }}>
                            <button
                              type="button"
                              onClick={() => setCartFulfillment('PICKUP')}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                background: cartFulfillment === 'PICKUP' ? 'var(--primary)' : 'transparent',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Key size={14} />
                              {t('Store Pickup', 'स्टोर पिकअप', 'দোকান থেকে পিকআপ')}
                            </button>
                            {(() => {
                              const storeCount = new Set(customerCart.map(i => i.stockistId)).size;
                              const multiStore = storeCount > 1;
                              return (
                                <button
                                  type="button"
                                  disabled={multiStore}
                                  onClick={() => !multiStore && setCartFulfillment('DELIVERY')}
                                  title={multiStore ? t('Multi-store orders: pickup only', 'मल्टी-स्टोर: केवल पिकअप', 'একাধিক দোকান: শুধুমাত্র পিকআপ') : ''}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: multiStore ? 'not-allowed' : 'pointer',
                                    opacity: multiStore ? 0.4 : 1,
                                    background: cartFulfillment === 'DELIVERY' ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Truck size={14} />
                                  {t('Home Delivery', 'होम डिलीवरी', 'হোম ডেলিভারি')}
                                  {multiStore && <span style={{ fontSize: '0.5rem', display: 'block' }}>(multi-store: pickup only)</span>}
                                </button>
                              );
                            })()}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{t(`${customerCart.length} Items Selected`, `${customerCart.length} सामान चुना गया`, `${customerCart.length}টি পণ্য নির্বাচন করা হয়েছে`)}</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent)' }}>₹{cartTotal.toFixed(2)}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            <span>{t('Subtotal', 'उप-योग', 'উপ-মোট')}: ₹{cartSubtotal}</span>
                            <span>{t('Est. Rewards', 'अनुमानित पुरस्कार', 'সম্ভাব‍্য পয়েন্ট')}: <strong style={{ color: 'var(--accent)' }}>+{formatPoints(estimatedEarnPoints)}</strong></span>
                          </div>

                          {cartFulfillment === 'DELIVERY' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 'bold' }}>
                              <span>{t('Delivery Fee', 'डिलिवरी शुल्क', 'ডেলিভারি চার্জ')}:</span>
                              <span>₹{cartDeliveryFee.toFixed(2)}</span>
                            </div>
                          )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', maxHeight: '100px', overflowY: 'auto' }}>
                                  {customerCart.map(item => (
                                    <div key={`${item.product.id}-${item.stockistId}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '130px' }}>{item.product.name} ({item.stockistName})</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <button onClick={() => updateCartQty(item.product.id, item.stockistId, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Minus size={10} /></button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateCartQty(item.product.id, item.stockistId, 1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Plus size={10} /></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* §E13: Compulsory Pickup Slot Picker (PICKUP only, per store) */}
                                {(() => {
                                  if (cartFulfillment !== 'PICKUP') return null;

                                  const groups = {};
                                  customerCart.forEach(item => {
                                    if (!groups[item.stockistId]) groups[item.stockistId] = item.stockistName;
                                  });

                                  const groupEntries = Object.entries(groups);

                                  let totalSlotsAcrossShops = 0;
                                  groupEntries.forEach(([sid]) => {
                                    const stockist = customerStockists.find(s => s.id === sid) || { id: sid, opening_time: '08:00', closing_time: '20:00', prep_eta_minutes: 10 };
                                    try {
                                      const sArr = getAvailableSlots(stockist);
                                      if (Array.isArray(sArr)) totalSlotsAcrossShops += sArr.length;
                                    } catch (e) {
                                      // count as 0 on error
                                    }
                                  });

                                  return (
                                    <div className="pickup-slot-picker-block" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', border: slotError ? '1px solid var(--danger)' : '1px dashed rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', marginTop: '0.25rem' }}>
                                      {isDevMode && (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                          fulfilment={cartFulfillment} · shops={groupEntries.length} · slots={totalSlotsAcrossShops}
                                        </div>
                                      )}

                                      <div className="pickup-slot-label" style={{ fontSize: '0.85rem', color: slotError ? 'var(--danger)' : 'white', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold' }}>
                                        <Clock size={10} /> {t('Select Pickup Slot (Required)', 'पिकअप समय चुनें (आवश्यक)', 'পিকআপ সময় নির্বাচন করুন (প্রয়োজনীয়)')}
                                      </div>

                                      {groupEntries.length === 0 ? (
                                        <div style={{ color: 'var(--danger)', fontSize: '0.75rem', padding: '0.25rem 0' }}>
                                          Could not determine which shop this order is from. Please remove and re-add your items.
                                        </div>
                                      ) : (
                                        groupEntries.map(([sid, sName]) => {
                                          const stockist = customerStockists.find(s => s.id === sid) || { id: sid, opening_time: '08:00', closing_time: '20:00', prep_eta_minutes: 10 };
                                          let SLOTS = [];
                                          let slotErr = null;
                                          try {
                                            SLOTS = getAvailableSlots(stockist);
                                          } catch (err) {
                                            console.error('Error fetching available slots for stockist:', err);
                                            slotErr = err;
                                          }

                                          if (slotErr) {
                                            return (
                                              <div key={sid} style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: '0.2rem 0' }}>
                                                <strong>{sName}:</strong> Could not load pickup times.
                                              </div>
                                            );
                                          }

                                          if (!SLOTS || SLOTS.length === 0) {
                                            return (
                                              <div key={sid} style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: '0.2rem 0' }}>
                                                <strong>{sName}:</strong> This shop has no pickup times available. Please choose Home Delivery or try another shop.
                                              </div>
                                            );
                                          }

                                          return (
                                            <div key={sid} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{sName}:</div>
                                              <select
                                                className="text-input"
                                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem', border: slotError && !cartPickupSlots[sid] ? '1px solid var(--danger)' : '1px solid var(--border-color)' }}
                                                value={cartPickupSlots[sid] || ''}
                                                onChange={e => { setCartPickupSlots(prev => ({ ...prev, [sid]: e.target.value })); setSlotError(false); }}
                                              >
                                                <option value="">{t('-- Pick a time slot --', '-- समय स्लॉट चुनें --', '-- समय स्लॉट বেছে নিন --')}</option>
                                                {SLOTS.map(slot => (
                                                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                                                ))}
                                              </select>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  );
                                })()}
                                
                                <button className="btn" style={{ width: '100%', fontSize: '0.8rem', border: slotError ? '2px solid var(--danger)' : undefined }} onClick={handleCheckout}>
                                  {cartFulfillment === 'PICKUP'
                                    ? <><Key size={14} style={{ marginRight: '0.25rem' }} />{t('Place Pickup Order', 'पिकअप ऑर्डर दें', 'পিকআপ অর্ডার দিন')}</>
                                    : <><Truck size={14} style={{ marginRight: '0.25rem' }} />{t('Place Delivery Order (COD)', 'डिलीवरी ऑर्डर (COD)', 'ডেলিভারি অর্ডার (COD)')}</>
                                  }
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {(customerAppTab === 'pointshop' || customerAppTab === 'rewards') && (() => {
                          const cableItems = availableRewards?.cable || [];
                          const broadbandItems = availableRewards?.broadband || [];
                          const emptyReasons = availableRewards?.empty_reasons || {};
                          const bindingsObj = availableRewards?.bindings || {};

                          const handleRedeemPackage = (pkg, partner) => {
                            if (customerBalance < pkg.point_cost) {
                              showToast(`Need ${formatPoints(pkg.point_cost)} — you have ${formatPoints(customerBalance)}`, 'error');
                              return;
                            }

                            triggerConfirmModal(
                              t('Redeem Package', 'पैकेज रिडीम करें', 'প্যাকেজ রিডিম করুন'),
                              t(
                                `Redeem ${formatPoints(pkg.point_cost)} for ${pkg.name}?`,
                                `क्या आप ${pkg.name} के लिए ${formatPoints(pkg.point_cost)} रिडीम करना चाहते हैं?`,
                                `আপনি কি ${pkg.name} এর জন্য ${formatPoints(pkg.point_cost)} রিডিম করতে চান?`
                              ),
                              async () => {
                                try {
                                  const res = await fetch(`${API_BASE}/ledger/redeem`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      customerId: currentUser.id,
                                      amount: pkg.point_cost,
                                      redemptionType: pkg.service_type,
                                      partner_package_id: pkg.id
                                    })
                                  });

                                  const data = await res.json();
                                  if (res.ok) {
                                    setRedemptionSuccessModal({
                                      partnerName: partner.display_name,
                                      pkgName: pkg.name
                                    });
                                    loadCustomerData();
                                    fetchAvailableRewards();
                                  } else {
                                    showToast(data.error || 'Redemption failed', 'error');
                                  }
                                } catch (err) {
                                  showToast('Redemption error', 'error');
                                }
                              },
                              false,
                              t('Redeem', 'रिडीम', 'রিডিম'),
                              t('Cancel', 'रद्द करें', 'বাতিল')
                            );
                          };

                          const renderRewardSection = (title, color, items, emptyReason, partnerName, serviceTypeKey) => {
                            const isCable = serviceTypeKey === 'cable';
                            const typeLabelEn = isCable ? 'cable' : 'broadband';
                            const typeLabelHi = isCable ? 'केबल' : 'ब्रॉडबैंड';
                            const typeLabelBn = isCable ? 'কেবল' : 'ব্রডব্যান্ড';

                            return (
                              <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                  <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: color }} />
                                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>{title}</span>
                                </div>

                                {emptyReason ? (
                                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                    {emptyReason === 'no_binding' && (
                                      <span>
                                        {t(
                                          `You haven't selected a ${typeLabelEn} provider yet. Go to Profile > Partners to choose one, or check back later when your local provider joins FastNet.`,
                                          `आपने अभी तक कोई ${typeLabelHi} प्रदाता नहीं चुना है। एक चुनने के लिए प्रोफाइल > पार्टनर्स पर जाएं, या बाद में जांचें जब आपका स्थानीय प्रदाता फास्टनेट में शामिल हो जाए।`,
                                          `আপনি এখনও কোনো ${typeLabelBn} প্রদানকারী নির্বাচন করেননি। একটি নির্বাচন করতে প্রোফাইল > পার্টনার্সে যান, অথবা আপনার স্থানীয় প্রদানকারী ফাস্টনেটে যোগ দিলে পরে দেখুন।`
                                        )}
                                      </span>
                                    )}
                                    {emptyReason === 'partner_inactive' && (
                                      <span>
                                        {t(
                                          `Your ${typeLabelEn} provider (${partnerName || t('your provider', 'आपका प्रदाता', 'আপনার প্রদানকারী')}) is currently paused. Please contact FastNet support or select a different provider in Profile > Partners.`,
                                          `आपका ${typeLabelHi} प्रदाता (${partnerName || t('आपका प्रदाता', 'आपका प्रदाता', 'আপনার প্রদানকারী')}) वर्तमान में रुका हुआ है। कृपया फास्टनेट सहायता से संपर्क करें या प्रोफाइल > पार्टनर्स में एक अलग प्रदाता चुनें।`,
                                          `আপনার ${typeLabelBn} প্রদানকারী (${partnerName || t('আপনার প্রদানকারী', 'आपका प्रदाता', 'আপনার প্রদানকারী')}) বর্তমানে সাময়িকভাবে বন্ধ রয়েছে। অনুগ্রহ করে ফাস্টনেট সহায়তার সাথে যোগাযোগ করুন অথবা প্রোফাইল > পার্টনার্সে অন্য প্রদানকারী বাছুন।`
                                        )}
                                      </span>
                                    )}
                                    {emptyReason === 'no_packages' && (
                                      <span>
                                        {t(
                                          "Your provider hasn't added recharge packages yet. They'll appear here once available.",
                                          "आपके प्रदाता ने अभी तक रिचार्ज पैकेज नहीं जोड़े हैं। उपलब्ध होने पर वे यहां दिखाई देंगे।",
                                          "আপনার প্রদানকারী এখনও রিচার্জ প্যাকেজ যোগ করেননি। উপলব্ধ হলে সেগুলি এখানে দেখাবে।"
                                        )}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {items.map(entry => {
                                      const pkg = entry.package;
                                      const partner = entry.partner;
                                      const canAfford = customerBalance >= pkg.point_cost;

                                      return (
                                        <div
                                          key={pkg.id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.65rem',
                                            padding: '0.65rem 0.75rem',
                                            borderRadius: '10px',
                                            background: canAfford ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                                            border: `1px solid ${canAfford ? color + '33' : 'rgba(255,255,255,0.05)'}`,
                                            opacity: canAfford ? 1 : 0.55,
                                            transition: 'all 0.2s'
                                          }}
                                        >
                                          <div style={{ flexShrink: 0, width: '32px', display: 'flex', justifyContent: 'center' }}>
                                            {isCable ? <Tv size={20} style={{ color }} /> : <Signal size={20} style={{ color }} />}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'white', lineHeight: 1.2 }}>{pkg.name}</div>
                                            {pkg.description && (
                                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{pkg.description}</div>
                                            )}
                                            <div style={{ fontSize: '0.6rem', color: '#818cf8', marginTop: '0.15rem' }}>
                                              {t(`from ${partner.display_name}`, `प्रदाता: ${partner.display_name}`, `প্রদানকারী: ${partner.display_name}`)}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                                              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color }}>{formatPoints(pkg.point_cost)}</span>
                                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                {t(`worth ₹${pkg.face_value_rupees}`, `मूल्य ₹${pkg.face_value_rupees}`, `मूल्य ₹${pkg.face_value_rupees}`)}
                                              </span>
                                            </div>
                                          </div>
                                          <button
                                            id={`redeem-${pkg.id}`}
                                            disabled={!canAfford}
                                            onClick={() => handleRedeemPackage(pkg, partner)}
                                            style={{
                                              flexShrink: 0,
                                              padding: '0.35rem 0.6rem',
                                              fontSize: '0.65rem',
                                              fontWeight: 'bold',
                                              borderRadius: '8px',
                                              border: 'none',
                                              cursor: canAfford ? 'pointer' : 'not-allowed',
                                              background: canAfford ? color : 'rgba(255,255,255,0.1)',
                                              color: canAfford ? 'white' : 'var(--text-muted)',
                                              transition: 'all 0.2s'
                                            }}
                                          >
                                            {t('Redeem', 'रिडीम', 'রিডিম')}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          };

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              {/* Header Hero */}
                              <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(236,72,153,0.15) 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '14px', padding: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{t('Your Balance', 'आपका बैलेंस', 'আপনার ব্যালেন্স')}</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>{formatPoints(customerBalance)}</div>
                                <div style={{ fontSize: '0.6rem', color: '#818cf8', marginTop: '0.35rem' }}>{t('Redeemable across FastNet broadband, wifi, and cable TV plans', 'फास्टनेट ब्रॉडबैंड, वाईफाई और केबल टीवी प्लान में रिडीम करने योग्य', 'ফাস্টনেট ব্রডব্যান্ড, ওয়াইফাই এবং কেবল টিভি প্ল্যানে রিডিম করার যোগ্য')}</div>
                              </div>

                              {/* Refer a friend Tile */}
                              <div className="referral-tile" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                  <Share2 size={16} style={{ color: '#22c55e' }} />
                                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>
                                    {t('Refer a friend', 'रेफर करें और कमाएं', 'বন্ধুকে রেফার করুন')}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                                  {t(
                                    'Share your code with friends. You both get +50 points when they complete their first order!',
                                    'अपने दोस्तों के साथ अपना कोड साझा करें। उनके पहला ऑर्डर पूरा करने पर आप दोनों को +50 अंक मिलते हैं!',
                                    'বন্ধুদের সাথে আপনার কোড শেয়ার করুন। তাদের প্রথম অর্ডার সম্পন্ন হলে আপনারা দুজনই +৫০ পয়েন্ট পাবেন!'
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px dashed rgba(34,197,94,0.4)' }}>
                                  <div>
                                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('Your Referral Code', 'आपका रेफरल कोड', 'আপনার রেফারেল কোড')}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '0.1em', color: '#4ade80' }}>
                                      {currentUser?.referral_code || '------'}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (currentUser?.referral_code) {
                                        navigator.clipboard.writeText(currentUser.referral_code);
                                        showToast(t('Referral code copied!', 'रेफरल कोड कॉपी हो गया!', 'रेফারেল কোড কপি হয়েছে!'));
                                      }
                                    }}
                                    style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid #22c55e', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '600' }}
                                  >
                                    {t('Copy Code', 'कोड कॉपी करें', 'কোড কপি করুন')}
                                  </button>
                                </div>
                              </div>

                              {/* Cable Recharges Section */}
                              {renderRewardSection(
                                t('Cable Recharges', 'केबल रिचार्ज', 'কেবল রিচার্জ'),
                                '#ec4899',
                                cableItems,
                                emptyReasons.cable,
                                bindingsObj.cable_partner_name,
                                'cable'
                              )}

                              {/* Broadband Recharges Section */}
                              {renderRewardSection(
                                t('Broadband Recharges', 'ब्रॉडबैंड रिचार्ज', 'ব্রডব্যান্ড রিচার্জ'),
                                '#6366f1',
                                broadbandItems,
                                emptyReasons.broadband,
                                bindingsObj.broadband_partner_name,
                                'broadband'
                              )}

                              {/* My Redemptions Section */}
                              <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                  <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#a855f7' }} />
                                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>
                                    {t('My Redemptions', 'मेरे रिडेम्पशन', 'আমার রিডেম্পশন')}
                                  </span>
                                </div>
                                {customerRedemptions.length === 0 ? (
                                  <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    {t("You haven't redeemed any rewards yet.", "आपने अभी तक कोई इनाम भुनाया नहीं है।", "আপনি এখনও কোনো পুরষ্কার রিডিম করেননি।")}
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {customerRedemptions.map(item => {
                                      const partnerDisplayName = item.partner_display_name || item.partner_name || t('Partner', 'साझेदार', 'পার্টনার');
                                      let statusLabel = item.status;
                                      if (item.status === 'PENDING_ADMIN_APPROVAL') {
                                        statusLabel = t('Waiting for FastNet approval', 'फास्टनेट की मंजूरी का इंतजार', 'ফাস্টনেট অনুমোদনের জন্য অপেক্ষা করা হচ্ছে');
                                      } else if (item.status === 'APPROVED_AWAITING_PARTNER') {
                                        statusLabel = t(`${partnerDisplayName} will contact you soon`, `${partnerDisplayName} आपसे जल्द ही संपर्क करेंगे`, `${partnerDisplayName} শীঘ্রই আপনার সাথে যোগাযোগ করবে`);
                                      } else if (item.status === 'FULFILLED') {
                                        statusLabel = t('Delivered ✓', 'डिलिवर हुआ ✓', 'ডেলিভার করা হয়েছে ✓');
                                      } else if (item.status === 'REJECTED') {
                                        statusLabel = t('Rejected — points refunded', 'अस्वीकृत — अंक वापस किए गए', 'বাতিল — পয়েন্ট ফেরত দেওয়া হয়েছে');
                                      } else if (item.status === 'DISPUTED') {
                                        statusLabel = t('Under review', 'समीक्षाधीन', 'পুনর্বিবেचनाधीन');
                                      }

                                      const statusColor = item.status === 'FULFILLED' ? '#22c55e' : item.status === 'REJECTED' ? '#9ca3af' : item.status === 'APPROVED_AWAITING_PARTNER' ? '#3b82f6' : '#eab308';
                                      
                                      let timestamp = item.created_at;
                                      if (item.status === 'APPROVED_AWAITING_PARTNER' && item.approved_at) timestamp = item.approved_at;
                                      else if (item.status === 'FULFILLED' && item.fulfilled_at) timestamp = item.fulfilled_at;
                                      else if (item.status === 'REJECTED' && item.rejected_at) timestamp = item.rejected_at;
                                      else if (item.status === 'DISPUTED' && item.disputed_at) timestamp = item.disputed_at;

                                      const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : '';

                                      return (
                                        <div key={item.id} className="glass-card" style={{ padding: '0.75rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>
                                              {item.package_name || 'Package'} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>• {partnerDisplayName}</span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: statusColor, marginTop: '0.2rem', fontWeight: '600' }}>
                                              {statusLabel}
                                            </div>
                                            {formattedTime && (
                                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                {formattedTime}
                                              </div>
                                            )}
                                          </div>
                                          <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ec4899' }}>
                                              -{formatPoints(item.points_deducted || item.amount || 0)}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                                Points earned from FastNet grocery orders · Redeemable against FastNet services only · Non-transferable
                              </div>
                            </div>
                          );
                        })()}

                  {customerAppTab === 'ledger' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Points Balance Card (Moderated) */}
                      <div className="points-glow-box" style={{ padding: '1.25rem 0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('ACCUMULATED LOYALTY POINTS', 'संचित लॉयल्टी पॉइंट्स', 'সঞ্চিত লয়্যালটি পয়েন্ট')}
                        </span>
                        <h1 style={{ fontSize: '1.75rem', margin: '0.25rem 0', color: 'white', fontWeight: 'bold' }}>{formatPoints(customerBalance)}</h1>
                        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', margin: 0 }}>
                          {t('Closed-loop points redeemable in the Rewards tab.', 'पुरस्कार टैब में रिडीम करने योग्य पॉइंट्स।', 'রিওয়ার্ডस ট্যাবে রিডিম করার যোগ্য পয়েন্ট।')}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                        <h3 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                          <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
                          {t('Points History', 'पॉइंट इतिहास', 'পয়েন্ট ইতিহাস')}
                        </h3>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={() => setShowFraudReportModal(true)}
                        >
                          <ShieldAlert size={12} style={{ color: 'var(--warning)' }} />
                          {t('Report a problem', 'समस्या रिपोर्ट करें', 'সমস্যা रिपोर्ट करें')}
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {customerLedger.map(l => (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px dashed rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: 'white' }}>{l.description}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{new Date(l.created_at).toLocaleDateString()}</div>
                            </div>
                            <div style={{ fontWeight: 'bold', color: l.type === 'EARN' ? 'var(--accent)' : 'var(--danger)', fontSize: '0.8rem' }}>
                              {l.amount > 0 ? '+' : ''}{formatPoints(l.amount)}
                            </div>
                          </div>
                        ))}
                        {customerLedger.length === 0 && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center' }}>
                            {t('No transactions recorded.', 'कोई लेन-देन दर्ज नहीं है।', 'কোনो লেনদেন রেকর্ড করা হয়নি।')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {customerAppTab === 'orders' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h3 style={{ fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <ArrowRightLeft size={14} style={{ color: 'var(--primary)' }} />
                        {t('My Orders', 'मेरे ऑर्डर', 'আমার অর্ডার')}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {customerOrders.map(o => {
                          const isPrepElapsed = prepElapsedOrders.includes(o.id);
                          return (
                            <div key={o.id} className="glass-card" style={{ padding: '0.65rem', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 'bold' }}>{t('Order', 'ऑर्डर', 'অর্ডার')} #{o.id.substring(2).toUpperCase()}</span>
                                 <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                   <span key={o.status} className={`badge ${o.status === 'DELIVERED' ? 'badge-success' : o.status === 'CANCELLED' ? 'badge-danger' : o.status === 'CONFIRMING' ? 'badge-primary' : 'badge-warning'} status-badge-glow`}>
                                     {o.status === 'CONFIRMING' ? t('Received (1 min cancel window)', 'प्राप्त (1 मिनट रद्द विंडो)', 'গৃহীত (১ মিনিট বাতিল সুযোগ)') : formatOrderStatusDisplay(o.status, o.fulfillment_type)}
                                   </span>
                                   {o.payment_status && (
                                     <span className={`badge ${o.payment_status === 'RELEASED' ? 'badge-success' : o.payment_status === 'COD' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem' }}>
                                       {o.payment_status === 'HELD' ? <><Lock size={9} /> HELD</> : o.payment_status === 'RELEASED' ? <><Check size={9} /> RELEASED</> : <><Banknote size={9} /> COD</>}
                                     </span>
                                   )}
                                 </div>
                              </div>
                              <div style={{ color: 'var(--text-muted)' }}>{t('Store', 'दुकान', 'दुकान')}: {o.stockist_name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {o.fulfillment_type === 'DELIVERY' ? (
                                  <>
                                    <Truck size={12} style={{ color: 'var(--secondary)' }} />
                                    <span>{t('Mode: DELIVERY', 'मोड: होम डिलीवरी', 'অবস্থা: হোম ডেলিভারি')}</span>
                                  </>
                                ) : (
                                  <>
                                    <Store size={12} style={{ color: 'var(--primary)' }} />
                                    <span>{t('Mode: Take Away', 'मोड: पिकअप', 'অবস্থা: पिकअप')} ({formatPickupSlotDisplay(o.pickup_slot) || t('Pending slot', 'स्लॉट लंबित', 'স্লট পেন্ডিং')})</span>
                                  </>
                                )}
                              </div>

                              {/* Static slot display + Change Slot button inside orders list if pickup is chosen */}
                              {o.status !== 'DELIVERED' && o.fulfillment_type === 'PICKUP' && (
                                <div style={{ border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '0.5rem', marginTop: '0.25rem', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                      {t('Selected Slot:', 'चुना गया स्लॉट:', 'নির্ধারিত স্লট:')} <strong style={{ color: 'white' }}>{formatPickupSlotDisplay(o.pickup_slot) || t('None', 'कोई नहीं', 'কোনোটি না')}</strong>
                                    </span>
                                    
                                    {!['READY', 'DELIVERED', 'CANCELLED'].includes(o.status) && (
                                      <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.1rem 0.35rem', fontSize: '0.55rem', minHeight: '20px', height: '20px' }}
                                        onClick={() => setChangingSlotOrderId(changingSlotOrderId === o.id ? null : o.id)}
                                      >
                                        {t('Change Slot', 'स्लॉट बदलें', 'স্লট পরিবর্তন')}
                                      </button>
                                    )}
                                  </div>

                                  {changingSlotOrderId === o.id && (() => {
                                    const stockist = customerStockists.find(s => s.id === o.stockist_id) || { opening_time: '08:00', closing_time: '20:00', prep_eta_minutes: 10 };
                                    const SLOTS = getAvailableSlots(stockist);
                                    return (
                                      <div style={{ marginTop: '0.2rem' }}>
                                        <select 
                                          className="text-input" 
                                          style={{ fontSize: '0.65rem', padding: '0.2rem', minHeight: '28px', height: '28px' }}
                                          value={o.pickup_slot || ''}
                                          onChange={e => {
                                            handleSavePickupSlot(o.id, e.target.value);
                                            setChangingSlotOrderId(null);
                                          }}
                                        >
                                          <option value="">{t('-- Choose Pickup Slot --', '-- पिकअप स्लॉट चुनें --', '-- পিকআপ স্লট নির্বাচন করুন --')}</option>
                                          {SLOTS.map(slot => (
                                            <option key={slot.value} value={slot.value}>{slot.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.35rem', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.05)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Key size={12} style={{ color: 'var(--primary)' }} />
                                  <span>{o.fulfillment_type === 'DELIVERY' ? t('Delivery PIN:', 'डिलीवरी पिन:', 'ডেলিভারি পিন:') : t('Pickup PIN:', 'पिकअप पिन:', 'পিকআপ কোড:')} <strong style={{ color: 'white', letterSpacing: '0.05em' }}>{o.pickup_pin || '1234'}</strong></span>
                                </div>
                              )}

                              {renderCancelButtonOrClosed(o)}

                              {/* §F19: No-show alert for missed pickup */}
                              {o.status === 'READY' && o.fulfillment_type === 'PICKUP' && (
                                <button
                                  className="btn btn-secondary"
                                  style={{ width: '100%', padding: '0.35rem', fontSize: '0.65rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: '1px solid var(--warning)' }}
                                  onClick={() => setNoShowAlert({ orderId: o.id, canReschedule: !o.reschedule_used })}
                                >
                                  <AlertTriangle size={12} /> {t('Missed Pickup? Report & Reschedule', 'पिकअप छूट गया? रिशेड्यूल', 'পিকআপ মিস? পুনরায় নির্ধারণ')}
                                </button>
                              )}

                              {/* §H: One-way delivery switch */}
                              {o.fulfillment_type === 'PICKUP' && o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'CONFIRMING' ? (
                                <div>
                                                                      <button 
                                      className="btn btn-secondary" 
                                      style={{ width: '100%', padding: '0.35rem', fontSize: '0.65rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                      onClick={() => triggerConfirmModal(
                                        t('Switch to Delivery', 'डिलिवरी पर स्विच करें', 'ডেলিভারিতে পরিবর্তন করুন'),
                                        t('Are you sure you want to switch to delivery? A delivery fee of ₹40 (or ₹30 for Rural) will be added to your order.', 'क्या आप डिलीवरी पर स्विच करना चाहते हैं? आपके ऑर्डर में ₹40 (ग्रामीण के लिए ₹30) का डिलीवरी शुल्क जोड़ा जाएगा।', 'আপনি কি নিশ্চিত যে আপনি ডেলিভারিতে পরিবর্তন করতে চান? আপনার অর্ডারে ₹৪০ (গ্রামীণ এলাকার জন্য ₹৩০) ডেলিভারি ফি যোগ করা হবে।'),
                                        () => handleSwitchToDeliveryConfirmed(o.id),
                                        false,
                                        t('Yes, Switch', 'हाँ, स्विच करें', 'হ্যাঁ, পরিবর্তন করুন'),
                                        t('No', 'नहीं', 'না')
                                      )}
                                    >
                                      <Truck size={12} /> {t('Switch to Delivery (One-way)', 'ডिलिवरी पर स्विच (एकतरफा)', 'ডেলিভারিতে পরিবর্তন (একমুখী)')}
                                    </button>
                                </div>
                              ) : o.fulfillment_type === 'DELIVERY' ? (
                                <div>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Truck size={12} /> {t('Mode: DELIVERY', 'डिलिवरी मोड', 'ডেলিভারি মোড')}
                                  </span>
                                </div>
                              ) : null}

                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                                <span>{t('Paid', 'भुगतान', 'পরিশোধ')}: ₹{o.total_price.toFixed(2)}</span>
                                
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                  <button 
                                    className="badge badge-primary" 
                                    style={{ border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                                    onClick={() => handleReorder(o)}
                                  >
                                    <RefreshCw size={10} /> {t('Reorder', 'पुनः ऑर्डर', 'রিঅর্ডার')}
                                  </button>

                                  <button 
                                    className="badge badge-success" 
                                    style={{ border: 'none', cursor: 'pointer', background: 'rgba(37,211,102,0.1)', color: '#25D366', padding: '0.2rem 0.4rem', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                                    onClick={() => setSimulatedWaMessage({
                                      orderId: o.id,
                                      customerName: currentUser.name,
                                      stockistName: o.stockist_name,
                                      totalPrice: o.total_price,
                                      pickupPin: o.pickup_pin,
                                      points: o.pointsCredited || o.points_credited || 0,
                                      subtotal: o.subtotal,
                                      fulfillmentType: o.fulfillment_type
                                    })}
                                  >
                                    <MessageSquare size={10} /> {t('Alert', 'अलर्ट', 'প্রিভিউ')}
                                  </button>

                                  {o.status === 'DELIVERED' ? (
                                    <button 
                                      className="badge badge-success" 
                                      style={{ border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem', fontSize: '0.6rem' }}
                                      onClick={() => {
                                        setSubmittingFeedbackOrder(o);
                                        setFeedbackRating(5);
                                        setFeedbackReason('');
                                      }}
                                    >
                                      Rate Shop
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {customerOrders.length === 0 && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center' }}>
                            {t('No orders placed yet.', 'कोई ऑर्डर अभी तक नहीं किया गया है।', 'কোনো অর্ডার এখনো করা হয়নি।')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Rating Modal Overlay */}
                  {submittingFeedbackOrder && submittingFeedbackOrder.customer_id === currentUser.id && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '1.5rem', justifyContent: 'center' }}>
                      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'white' }}>Rate Grocery Store (§11)</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Rate service quality at {submittingFeedbackOrder.stockist_name}</p>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {[1,2,3,4,5].map(star => (
                            <span 
                              key={star} 
                              style={{ fontSize: '1.5rem', cursor: 'pointer', color: star <= feedbackRating ? 'var(--warning)' : 'var(--text-muted)' }}
                              onClick={() => setFeedbackRating(star)}
                            >
                              ★
                            </span>
                          ))}
                        </div>

                        <div className="input-group">
                          <label className="input-label">Details / Comment</label>
                          <textarea 
                            className="text-input" 
                            style={{ height: '60px', fontSize: '0.75rem' }} 
                            placeholder="e.g. Fresh potatoes, quick preparation!"
                            value={feedbackReason}
                            onChange={e => setFeedbackReason(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-accent" style={{ flex: 1 }} onClick={() => handleSaveFeedback('CUSTOMER')}>
                            Submit Rating
                          </button>
                          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSubmittingFeedbackOrder(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Redemption Success Modal Overlay */}
                  {redemptionSuccessModal && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
                      <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '2px solid var(--accent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                          <Check size={28} />
                        </div>
                        <h3 style={{ fontSize: '1rem', color: 'white', margin: 0 }}>{t('Redemption Requested!', 'रिडेम्पशन का अनुरोध किया गया!', 'রিডিমশন অনুরোধ করা হয়েছে!')}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                          {t(
                            `Your partner ${redemptionSuccessModal.partnerName} will contact you soon to activate ${redemptionSuccessModal.pkgName}.`,
                            `आपका प्रदाता ${redemptionSuccessModal.partnerName} शीघ्र ही ${redemptionSuccessModal.pkgName} को सक्रिय करने के लिए आपसे संपर्क करेगा।`,
                            `আপনার প্রদানকারী ${redemptionSuccessModal.partnerName} শীঘ্রই ${redemptionSuccessModal.pkgName} সক্রিয় করতে আপনার সাথে যোগাযোগ করবে।`
                          )}
                        </p>
                        <button className="btn btn-accent" onClick={() => setRedemptionSuccessModal(null)} style={{ width: '100%' }}>
                          {t('Done', 'हो गया', 'সম্পন্ন')}
                        </button>
                      </div>
                    </div>
                  )}

                  {customerAppTab === 'profile' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>
                        {t('My Profile', 'मेरा प्रोफाइल', 'আমার প্রোফাইল')}
                      </h3>

                      {/* Inactive Provider Warning Banners */}
                      {(() => {
                        const activeCableId = customerBindings?.cable_partner_id;
                        const activeBroadbandId = customerBindings?.broadband_partner_id;
                        const cablePartnerObj = activeCableId ? (profileAvailablePartners.cable || []).find(p => p.id === activeCableId) : null;
                        const broadbandPartnerObj = activeBroadbandId ? (profileAvailablePartners.broadband || []).find(p => p.id === activeBroadbandId) : null;

                        const isCableInactive = activeCableId && !cablePartnerObj;
                        const isBroadbandInactive = activeBroadbandId && !broadbandPartnerObj;

                        return (
                          <>
                            {isCableInactive && (
                              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                                {t(
                                  'Your cable provider is currently inactive. Please choose a different provider or wait for their status to update.',
                                  'आपका केबल प्रदाता वर्तमान में निष्क्रिय है। कृपया एक अलग प्रदाता चुनें या उनकी स्थिति अपडेट होने की प्रतीक्षा करें।',
                                  'আপনার ক্যাবল প্রদানকারী বর্তমানে নিষ্ক্রিয়। অনুগ্রহ করে অন্য প্রদানকারী চয়ন করুন বা তাদের স্ট্যাটাস আপডেট হওয়ার অপেক্ষা করুন।'
                                )}
                              </div>
                            )}
                            {isBroadbandInactive && (
                              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                                {t(
                                  'Your broadband provider is currently inactive. Please choose a different provider or wait for their status to update.',
                                  'आपका ब्रॉडबैंड प्रदाता वर्तमान में निष्क्रिय है। कृपया एक अलग प्रदाता चुनें या उनकी स्थिति अपडेट होने की प्रतीक्षा करें।',
                                  'আপনার ব্রডব্যান্ড প্রদানকারী বর্তমানে নিষ্ক্রিয়। অনুগ্রহ করে অন্য প্রদানকারী চয়ন করুন বা তাদের স্ট্যাটাস আপডেট হওয়ার অপেক্ষা করুন।'
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}

                      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div className="input-group">
                          <label className="input-label">{t('Full Name', 'पूरा नाम', 'পুরো নাম')}</label>
                          <input
                            type="text"
                            className="text-input"
                            value={profileName}
                            onChange={e => setProfileName(e.target.value)}
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">{t('Phone Number', 'फ़ोन नंबर', 'फोन नंबर')}</label>
                          <input
                            type="text"
                            className="text-input"
                            disabled
                            value={currentUser.phone}
                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">{t('Region', 'क्षेत्र', 'অঞ্চল')}</label>
                          <input
                            type="text"
                            className="text-input"
                            disabled
                            value={activeRegionName}
                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">{t('Delivery Address', 'डिलीवरी पता', 'ডেলিভারি ঠিকানা')}</label>
                          <textarea
                            className="text-input"
                            style={{ height: '60px', fontSize: '0.8rem' }}
                            value={profileAddress}
                            onChange={e => setProfileAddress(e.target.value)}
                          />
                        </div>

                        {/* Cable Operator Selection */}
                        <div className="input-group">
                          <label className="input-label" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                            {t('CHOOSE YOUR LOCAL CABLE OPERATOR', 'अपने स्थानीय केबल ऑपरेटर को चुनें', 'আপনার স্থানীয় কেবল অপারেটর বাছুন')}
                          </label>
                          <select
                            className="text-input"
                            value={profileNoCable ? 'NOT_LISTED' : profileCablePartnerId}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'NOT_LISTED') {
                                setProfileNoCable(true);
                                setProfileCablePartnerId('');
                              } else {
                                setProfileNoCable(false);
                                setProfileCablePartnerId(val);
                              }
                            }}
                          >
                            <option value="" disabled>-- Select --</option>
                            {(profileAvailablePartners.cable || []).map(p => (
                              <option key={p.id} value={p.id}>{p.display_name}</option>
                            ))}
                            <option value="NOT_LISTED" style={{ fontStyle: 'italic', fontSize: '0.85em' }}>
                              {t("My provider isn't listed yet", "मेरा प्रदाता अभी सूचीबद्ध नहीं है", "আমার প্রদানকারী এখনও তালিকাভুক্ত নয়")}
                            </option>
                          </select>
                        </div>

                        {/* Broadband Operator Selection */}
                        <div className="input-group">
                          <label className="input-label" style={{ fontWeight: 'bold' }}>
                            {t('Do you have a local internet/wi-fi provider?', 'क्या आपके पास स्थानीय इंटरनेट/वाई-फाई प्रदाता है?', 'আপনার কি কোনো স্থানীয় ইন্টারনেট/ওয়াই-ফাই প্রদানকারী আছে?')}
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn"
                              style={{
                                flex: 1,
                                background: profileHasBroadband ? 'var(--success, #10b981)' : 'var(--bg-card, rgba(255,255,255,0.05))',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                              onClick={() => {
                                setProfileHasBroadband(true);
                              }}
                            >
                              {t('Yes', 'हाँ', 'হ্যাঁ')}
                            </button>
                            <button
                              type="button"
                              className="btn"
                              style={{
                                flex: 1,
                                background: !profileHasBroadband ? 'var(--danger, #ef4444)' : 'var(--bg-card, rgba(255,255,255,0.05))',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                              onClick={() => {
                                setProfileHasBroadband(false);
                                setProfileBroadbandPartnerId('');
                                setProfileNoBroadband(true);
                              }}
                            >
                              {t('No', 'नहीं', 'ना')}
                            </button>
                          </div>

                          {profileHasBroadband && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <select
                                className="text-input"
                                value={profileNoBroadband ? 'NOT_LISTED' : profileBroadbandPartnerId}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === 'NOT_LISTED') {
                                    setProfileNoBroadband(true);
                                    setProfileBroadbandPartnerId('');
                                  } else {
                                    setProfileNoBroadband(false);
                                    setProfileBroadbandPartnerId(val);
                                  }
                                }}
                              >
                                <option value="" disabled>-- Select --</option>
                                {(profileAvailablePartners.broadband || []).map(p => (
                                  <option key={p.id} value={p.id}>{p.display_name}</option>
                                ))}
                                <option value="NOT_LISTED" style={{ fontStyle: 'italic', fontSize: '0.85em' }}>
                                  {t("My provider isn't listed yet", "मेरा प्रदाता अभी सूचीबद्ध नहीं है", "আমার প্রদানকারী এখনও তালিকাভুক্ত নয়")}
                                </option>
                              </select>
                            </div>
                          )}
                        </div>

                        <button
                          className="btn btn-accent"
                          disabled={profileSaving}
                          onClick={handleSaveProfile}
                          style={{ marginTop: '0.5rem', width: '100%' }}
                        >
                          {profileSaving ? t('Saving...', 'सहेजा जा रहा है...', 'সংরক্ষণ করা হচ্ছে...') : t('Save Profile', 'प्रोफाइल सहेजें', 'প্রোফাইল সংরক্ষণ')}
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                <div className="phone-footer">
                  <button className={`phone-nav-btn ${customerAppTab === 'store' ? 'active' : ''}`} onClick={() => setCustomerAppTab('store')}>
                    <ShoppingBag size={18} />
                    {t('Shop', 'दुकान', 'বাজার')}
                  </button>
                  <button className={`phone-nav-btn ${customerAppTab === 'ledger' ? 'active' : ''}`} onClick={() => setCustomerAppTab('ledger')}>
                    <Sparkles size={18} />
                    {t('Points', 'पॉइंट्स', 'পয়েন্ট')}
                  </button>
                  <button id="nav-pointshop" className={`phone-nav-btn ${customerAppTab === 'pointshop' ? 'active' : ''}`} onClick={() => setCustomerAppTab('pointshop')} style={{ position: 'relative' }}>
                    <Gift size={18} />
                    {t('Rewards', 'इनाम', 'রিওয়ার্ডস')}
                    {customerBalance > 0 && <span style={{ position: 'absolute', top: '4px', right: '6px', background: 'var(--accent)', color: 'black', fontSize: '0.45rem', fontWeight: 'bold', borderRadius: '99px', padding: '1px 4px', lineHeight: 1.2 }}>{Math.floor(customerBalance)}</span>}
                  </button>
                  <button className={`phone-nav-btn ${customerAppTab === 'orders' ? 'active' : ''}`} onClick={() => setCustomerAppTab('orders')}>
                    <ArrowRightLeft size={18} />
                    {t('Orders', 'ऑर्डर', 'অর্ডার')}
                  </button>
                  <button className={`phone-nav-btn ${customerAppTab === 'profile' ? 'active' : ''}`} onClick={() => setCustomerAppTab('profile')}>
                    <User size={18} />
                    {t('My Profile', 'मेरा प्रोफाइल', 'আমার প্রোফাইল')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 3. STOCKIST MOBILE APP SIMULATOR
  // ----------------------------------------------------
  const renderStockistView = () => {
    const isLoggedOut = !currentUser || currentUser.role !== 'STOCKIST';
    const activeRegionName = currentUser ? (regions.find(r => r.id === currentUser.region_id)?.name || 'Kolkata South (Garia)') : 'Kolkata South (Garia)';

    // Compute today's earnings (sum of stockist_amount for DELIVERED orders)
    const todaysEarnings = stockistOrders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (parseFloat(o.stockist_amount) || 0), 0);

    const renderOrderProgressBar = (status, fulfillmentType = 'DELIVERY') => {
      const isPickup = fulfillmentType === 'PICKUP';
      const steps = [
        { key: 'CONFIRMING', label: t('Order Placed', 'ऑर्डर दिया गया', 'অর্ডার দেওয়া হয়েছে') },
        { key: 'RECEIVED', label: t('Received', 'प्राप्त', 'গৃহীত') },
        { key: 'READY', label: isPickup ? t('Ready for Pickup', 'पिकअप के लिए तैयार', 'পিকআপের জন্য প্রস্তুত') : t('Ready for Delivery', 'वितरण के लिए तैयार', 'ডেলিভারির জন্য প্রস্তুত') },
        { key: 'DELIVERED', label: isPickup ? t('Picked Up', 'পিকআপ করা হয়েছে', 'পিকআপ সম্পন্ন') : t('Delivered', 'वितरित', 'ডেলিভারি সম্পন্ন') }
      ];

      const currentIndex = steps.findIndex(s => s.key === status);
      const fillPercent = currentIndex === -1 ? 0 : (currentIndex / (steps.length - 1)) * 100;

      return (
        <div className="order-progress-container" style={{ margin: '0.4rem 0 0.8rem 0' }}>
          <div className="order-progress-line-bg"></div>
          <div className="order-progress-line-fill" style={{ width: `${fillPercent}%` }}></div>
          {steps.map((s, idx) => {
            let stepClass = 'order-progress-step';
            if (idx === currentIndex) stepClass += ' active';
            else if (idx < currentIndex) stepClass += ' completed';

            return (
              <div key={s.key} className={stepClass}>
                <div className="order-progress-dot"></div>
                <span className="order-progress-label" style={{ fontSize: '0.5rem' }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        <div className="perspective-banner">
          <span><Store size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} /> SHOPKEEPER VIEW (দোকানদার মোড): {isLoggedOut ? "Not logged in (লগইন করা নেই)" : `${stockistProfile?.name || currentUser.name} (${activeRegionName})`}</span>
        </div>

        <div className="phone-mockup">
          <div className="phone-notch"></div>
          <div className="phone-screen">
            {isLoggedOut ? (
              <>
                <div className="phone-header">
                  <span>FastNet 5G</span>
                  <span><Signal size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /><Battery size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> 19:43</span>
                </div>
                {renderAuthForm('stockist')}
              </>
            ) : !stockistProfile ? (
              <>
                <div className="phone-header">
                  <span>FastNet 5G</span>
                  <span><Signal size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /><Battery size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> 19:43</span>
                </div>
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justify: 'center', height: '100%', gap: '1rem' }}>
                  <ShieldAlert size={48} style={{ color: 'var(--warning)', alignSelf: 'center' }} />
                  <h3>KYC Pending / Approved Profile Missing</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Your KYC is either pending approval from the Super Admin, or your stockist profile has not been initialized.
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '4px' }}>
                    Go to the **Admin Dashboard** tab to approve pending KYC and assign a Vendor first.
                  </p>
                  <button className="btn btn-secondary" onClick={handleLogout}>Log Out</button>
                </div>
              </>
            ) : (
              <>
                <div className="phone-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {offlineMode ? <WifiOff size={12} style={{ color: 'var(--danger)' }} /> : <Wifi size={12} style={{ color: 'var(--accent)' }} />}
                    {stockistProfile.name}
                  </span>
                  <span className={`badge ${offlineMode ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.55rem' }}>
                    {offlineMode ? 'Offline' : 'Online'}
                  </span>
                </div>

                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, overflowY: 'auto' }}>
                  
                  {stockistActiveTab === 'orders' && (
                    <>
                      {/* §J: Stockist language selector */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', marginBottom: '-0.35rem' }}>
                        <Languages size={12} style={{ color: 'var(--text-muted)' }} />
                        <select
                          className="text-input"
                          style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', width: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                          value={lang}
                          onChange={e => setLang(e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="hi">हिंदी</option>
                          <option value="bn">বাংলা</option>
                        </select>
                      </div>

                      {/* Grid layout for Today's Earnings & COD Commission */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                        {/* Today's Earnings Summary Widget */}
                        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-glow) 100%)', borderRadius: '12px', padding: '0.85rem 1rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '0.15rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Store size={10} /> {t("Today's Earnings", "आज की कमाई", "আজকের আয়")}
                          </span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>
                            ₹{todaysEarnings.toFixed(2)}
                          </span>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.75)' }}>{t("Settlement to bank", "बैंक में निपटान", "ব্যাংক সেটেলমেন্ট")}</span>
                        </div>

                        {/* COD Commission Owed Widget */}
                        <div style={{ background: 'linear-gradient(135deg, var(--bg-surface-elevated) 0%, rgba(255,255,255,0.02) 100%)', borderRadius: '12px', padding: '0.85rem 1rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '0.15rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <AlertCircle size={10} style={{ color: 'var(--warning)' }} /> {t("COD Commission Owed", "COD कमीशन देय", "COD কমিশন বকেয়া")}
                          </span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'var(--warning)' }}>
                            ₹{stockistAnalytics?.cod_commission_outstanding !== undefined ? stockistAnalytics.cod_commission_outstanding.toFixed(2) : '0.00'}
                          </span>
                          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{t("Owed to FastNet", "फास्टनेट का देय", "ফাস্টনেট এর বকেয়া")}</span>
                        </div>
                      </div>

                      {/* Sync bar if offline queue has items */}
                      {offlineQueue.length > 0 && (
                        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', borderRadius: '6px', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                          <span><strong>{offlineQueue.length}</strong> {t("updates pending sync", "अपडेट सिंक लंबित", "আপডেট সিঙ্ক পেন্ডিং")}</span>
                          {!offlineMode && (
                            <button className="badge badge-warning" style={{ border: 'none', cursor: 'pointer' }} onClick={handleSyncOfflineQueue}>
                              {t("Sync Now", "अभी सिंक करें", "এখনই সিঙ্ক করুন")}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Offline toggle control */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <h4 style={{ fontSize: '0.8rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Signal size={14} /> {t("Network Signal", "नेटवर्क सिग्नल", "নেটওয়ার্ক সিগন্যাল")}
                          </h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{t("Test offline rural store state", "ऑफ़लाइन ग्रामीण स्टोर स्थिति का परीक्षण करें", "অফলাইন গ্রামীণ স্টোর পরীক্ষা")}</p>
                        </div>
                        <button 
                          onClick={toggleOfflineMode} 
                          className={`badge ${offlineMode ? 'badge-danger' : 'badge-success'}`}
                          style={{ border: 'none', cursor: 'pointer', padding: '0.4rem 0.6rem', textTransform: 'uppercase' }}
                        >
                          {offlineMode ? t('Connect', 'कनेक्ट करें', 'কানেক্ট করুন') : t('Disconnect', 'डिस्कनेक्ट करें', 'ডিসকানেক্ট করুন')}
                        </button>
                      </div>

                      {/* Active Orders Queue */}
                      <h3 style={{ fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowRightLeft size={14} style={{ color: 'var(--primary)' }} />
                        {t("New Orders", "नए ऑर्डर", "নতুন অর্ডার")}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {stockistOrders.map(o => {
                          const isNew = o.status === 'CONFIRMING';
                          return (
                            <div 
                              key={o.id} 
                              className={`glass-card ${isNew ? 'new-order-card' : ''}`} 
                              style={{ 
                                padding: '0.75rem', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.5rem',
                                border: isNew ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {/* Order Header / New Badge */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'white' }}>
                                  Order #{o.id.substring(2).toUpperCase()}
                                </span>
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                  {isNew && (
                                    <span className="badge badge-primary" style={{ fontSize: '0.55rem', background: 'var(--primary)', color: 'white', padding: '0.15rem 0.35rem', animation: 'pulse 1s infinite', fontWeight: 'bold' }}>
                                      NEW
                                    </span>
                                  )}
                                  <span className={`badge ${o.status === 'DELIVERED' ? 'badge-success' : o.status === 'CANCELLED' ? 'badge-danger' : o.status === 'CONFIRMING' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                                    {o.status === 'CONFIRMING' ? '⏳ RECEIVED' : formatOrderStatusDisplay(o.status, o.fulfillment_type)}
                                  </span>
                                  {/* Pickup slot badge */}
                                  {o.pickup_slot && (
                                    <span className="badge" style={{ fontSize: '0.55rem', background: 'rgba(16,185,129,0.15)', color: 'var(--accent)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                      <Clock size={8} style={{ marginRight: '0.15rem', verticalAlign: 'middle' }} />
                                      {o.pickup_slot}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Basic Customer Context */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.45rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <UserCheck size={12} style={{ color: 'var(--primary)' }} /> {o.customer_name}
                                  </span>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                    <MapPin size={10} /> {o.region_id === 'r2' ? 'Bishnupur Rural' : 'Garia Urban'}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Phone size={10} /> {o.customer_phone || 'N/A'}
                                </span>
                              </div>

                              {/* Visual Step Progress Bar */}
                              {renderOrderProgressBar(o.status, o.fulfillment_type)}

                              {/* Order Items List */}
                              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.4rem 0.5rem', borderRadius: '4px' }}>
                                <div style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem' }}>{t("ITEMS TO PACK:", "पैकिंग के लिए आइटम:", "প্যাকিং এর জিনিসপত্র:")}</div>
                                {o.items && o.items.map(item => (
                                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontSize: '0.7rem' }}>
                                    <span>• {item.name} x {item.quantity}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>₹{item.price * item.quantity}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Split Payout Breakdown */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', border: '1px dashed rgba(99, 102, 241, 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  <span>Split Settlements (প্রাপ্য কমিশন ভাগ):</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Store size={12} /> {t("Payout to You:", "आपका भुगतान:", "আপনার পাওনা:")}
                                  </span>
                                  <span style={{ color: 'var(--accent)' }}>₹{parseFloat(o.stockist_amount || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  <span>{t("Commission Split:", "कमीशन विभाजन:", "কমিশন স্প্লিট:")}</span>
                                  <span>₹{parseFloat(o.platform_amount || 0).toFixed(2)}</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0 0.1rem' }}>
                                <span>{t("Basket Subtotal", "बास्केट उप-योग", "ঝুড়ির উপ-মোট")}: ₹{o.subtotal}</span>
                                <span>{t("Total Price", "कुल मूल्य", "মোট মূল্য")}: ₹{o.total_price}</span>
                              </div>

                              {/* Action Buttons */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  {o.status === 'CONFIRMING' && (
                                    <button className="btn" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'RECEIVED')}>
                                      {t('Accept Order', 'स्वीकार करें', 'গ্রহণ করুন')}
                                    </button>
                                  )}
                                  {o.status === 'RECEIVED' && (
                                    <button className="btn btn-accent" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'READY')}>
                                      {o.fulfillment_type === 'PICKUP' ? t('Mark Ready', 'तैयार चिह्नित करें', 'রেডি চিহ্নিত করুন') : t('Mark Ready for Delivery', 'वितरण के लिए तैयार', 'ডেলিভারির জন্য তৈরি')}
                                    </button>
                                  )}
                                  {o.status === 'READY' && (
                                    <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                                      <input 
                                        type="text" 
                                        placeholder={o.fulfillment_type === 'DELIVERY' ? t("Enter Delivery PIN", "डिलीवरी पिन दर्ज करें", "ডেলিভারি পিন লিখুন") : t("Enter PIN", "पिन दर्ज करें", "পিন লিখুন")} 
                                        title={t("Enter customer's PIN to confirm handoff", "हैंडऑफ की पुष्टि के लिए ग्राहक का पिन दर्ज करें", "হ্যান্ডঅফ নিশ্চিত করতে গ্রাহকের পিন লিখুন")}
                                        maxLength="4"
                                        style={{ flex: 1, padding: '0.25rem', fontSize: '0.7rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center' }}
                                        value={enteredPins[o.id] || ''}
                                        onChange={e => setEnteredPins(prev => ({ ...prev, [o.id]: e.target.value }))}
                                      />
                                      <button 
                                        className="btn btn-accent" 
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                                        onClick={() => handleVerifyPickupPIN(o.id)}
                                      >
                                        Verify
                                      </button>
                                    </div>
                                  )}
                                  {o.status === 'CONFIRMING' && (
                                    <button className="btn btn-danger" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'CANCELLED')}>{t('Cancel', 'रद्द करें', 'বাতিল करें')}</button>
                                  )}
                                </div>
                                
                                {(o.status === 'DELIVERED' || o.status === 'CANCELLED') && (
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ width: '100%', padding: '0.25rem 0', fontSize: '0.65rem', background: 'rgba(245,158,11,0.06)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                    onClick={() => {
                                      setSubmittingFeedbackOrder(o);
                                      setFeedbackRating(5);
                                      setFeedbackReason('');
                                      setReportFlag(false);
                                    }}
                                  >
                                    <UserCheck size={12} /> {t('Rate Customer', 'ग्राहक को रेट करें', 'ক্রেতাকে রেটিং দিন')}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {stockistOrders.length === 0 && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>No orders in queue.</p>
                        )}
                      </div>
                    </>
                  )}

                  {stockistActiveTab === 'inventory' && (
                    <>
                      {/* Inventory Restock Panel */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                        <h3 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Package size={14} style={{ color: 'var(--primary)' }} /> {t("Inventory SKU list", "इन्वेंट्री SKU सूची", "ইনভেন্টরি SKU তালিকা")}
                        </h3>
                        <button 
                          className="btn btn-accent" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', height: '28px', minHeight: '28px' }} 
                          onClick={() => setShowAddProductModal(true)}
                        >
                          {t("+ Add SKU", "+ SKU जोड़ें", "+ SKU যোগ করুন")}
                        </button>
                      </div>

                      {/* Stockist Inventory Search Bar (#5) */}
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="text" 
                          placeholder={t("Search stock inventory...", "स्टॉक इन्वेंट्री खोजें...", "ইনভেন্টরি খুঁজুন...")}
                          className="text-input" 
                          style={{ width: '100%', paddingLeft: '2.25rem', height: '36px', minHeight: '36px', fontSize: '0.75rem' }}
                          value={stockistProductSearch}
                          onChange={e => setStockistProductSearch(e.target.value)}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '11px', color: 'var(--text-muted)' }} />
                        {stockistProductSearch && (
                          <button 
                            onClick={() => setStockistProductSearch('')}
                            style={{ position: 'absolute', right: '0.75rem', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t("Low Stock Threshold:", "कम स्टॉक सीमा:", "কম স্টক থ্রেশহোল্ড:")}</span>
                        <input 
                          type="number" 
                          min="0" 
                          style={{ width: '45px', padding: '0.2rem', fontSize: '0.7rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center' }}
                          value={lowStockThreshold}
                          onChange={e => setLowStockThreshold(e.target.value)}
                        />
                      </div>
                      
                      <div className="input-group" style={{ margin: 0 }}>
                        <label className="input-label" style={{ fontSize: '0.65rem' }}>Select Wholesaler (পাইকারি বিক্রেতা)</label>
                        <select 
                          className="text-input" 
                          value={selectedRestockVendorId} 
                          onChange={e => setSelectedRestockVendorId(e.target.value)}
                          style={{ background: 'var(--bg-surface)', fontSize: '0.7rem', padding: '0.25rem', minHeight: '32px' }}
                        >
                          {stockistApprovedVendors.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                          {stockistApprovedVendors.length === 0 && (
                            <option value="">{t("No Approved Wholesalers", "कोई स्वीकृत थोक विक्रेता नहीं", "কোনো অনুমোদিত পাইকারি বিক্রেতা নেই")}</option>
                          )}
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {stockistProducts
                          .filter(p => p.name.toLowerCase().includes(stockistProductSearch.toLowerCase()))
                          .map(p => {
                            const isLowStock = p.stock_qty < parseInt(lowStockThreshold || '15', 10);
                            return (
                              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: isLowStock ? '1px dashed var(--warning)' : '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {p.name}
                                    {p.has_flagged_bill && (
                                      <AlertTriangle size={12} style={{ color: 'var(--danger)' }} title="This product has a flagged bill photo under review by admin." />
                                    )}
                                    <Edit 
                                      size={12} 
                                      style={{ color: 'var(--text-muted)', cursor: 'pointer', verticalAlign: 'middle' }} 
                                      onClick={() => handleStartEditProduct(p)}
                                    />
                                  </div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span>{t("Stock qty:", "स्टॉक मात्रा:", "স্টক পরিমাণ:")}</span>
                                    <strong style={{ color: p.stock_qty > 0 ? 'var(--accent)' : 'var(--danger)' }}>{p.stock_qty}</strong>
                                    {isLowStock && (
                                      <span style={{ color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontWeight: 'bold' }}>
                                        <AlertTriangle size={10} /> {t("Low Stock", "कम स्टॉक", "কম স্টক")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    style={{ width: '45px', padding: '0.25rem', fontSize: '0.7rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center' }}
                                    value={restockQuantities[p.id] || '20'}
                                    onChange={e => setRestockQuantities(prev => ({ ...prev, [p.id]: e.target.value }))}
                                  />
                                  <button 
                                    className="btn btn-accent" 
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', minHeight: '28px', height: '28px' }}
                                    onClick={() => handlePurchaseStock(p.id, restockQuantities[p.id] || 20, selectedRestockVendorId)}
                                  >
                                    {t('Buy', 'खरीदें', 'কিনুন')}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        {stockistProducts.filter(p => p.name.toLowerCase().includes(stockistProductSearch.toLowerCase())).length === 0 && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>{t("No matching inventory products.", "कोई मिलान वाले इन्वेंट्री उत्पाद नहीं।", "কোনো মিলতি ইনভেন্টরি পণ্য নেই।")}</p>
                        )}
                      </div>
                    </>
                  )}

                  {stockistActiveTab === 'analytics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <h3 style={{ fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BarChart2 size={14} style={{ color: 'var(--primary)' }} />
                        {t("Performance Analytics", "प्रदर्शन विश्लेषण", "পারফরম্যান্স অ্যানালিটিক্স")}
                      </h3>

                      {stockistAnalytics ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                            <div className="glass-card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("Today's Sales", "आज की बिक्री", "आजকের বিক্রি")}</span>
                              <h3 style={{ fontSize: '1.2rem', color: 'white', margin: '0.15rem 0' }}>₹{stockistAnalytics.today_earnings.toFixed(2)}</h3>
                              <span style={{ fontSize: '0.55rem', color: 'var(--accent)', fontWeight: 'bold' }}>{stockistAnalytics.today_order_count} orders</span>
                            </div>
                            <div className="glass-card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("Avg Order Value", "औसत ऑर्डर मूल्य", "গড় অর্ডার মূল্য")}</span>
                              <h3 style={{ fontSize: '1.2rem', color: 'white', margin: '0.15rem 0' }}>₹{stockistAnalytics.avg_order_value.toFixed(2)}</h3>
                              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{t("fulfilled orders", "पूरे किए गए ऑर्डर", "সম্পন্ন অর্ডার")}</span>
                            </div>
                          </div>

                          <div className="glass-card" style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {analyticsRange === 'weekly' ? t('7-Day Sales Trend (₹)', '7-दिवसीय बिक्री रुझान (₹)', '৭-দিনের সেলস ট্রেন্ড (₹)') : t('4-Week Sales Trend (₹)', '4-सप्ताह बिक्री रुझान (₹)', '৪-সप्ताहের সেলস ট্রেন্ড (₹)')}
                              </span>
                              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '0.1rem' }}>
                                <button
                                  type="button"
                                  onClick={() => setAnalyticsRange('weekly')}
                                  style={{
                                    border: 'none',
                                    fontSize: '0.55rem',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    background: analyticsRange === 'weekly' ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {t('Weekly', 'साप्ताहिक', 'সাপ্তাহিক')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAnalyticsRange('monthly')}
                                  style={{
                                    border: 'none',
                                    fontSize: '0.55rem',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    background: analyticsRange === 'monthly' ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {t('Monthly', 'मासिक', 'মাসিক')}
                                </button>
                              </div>
                            </div>
                            <div style={{ height: 130, width: '100%', marginTop: '0.5rem' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsRange === 'weekly' ? stockistAnalytics.weekly_data : (stockistAnalytics.monthly_data || [])} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={8} tickLine={false} />
                                  <YAxis stroke="var(--text-muted)" fontSize={8} tickLine={false} />
                                  <Tooltip 
                                    contentStyle={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '9px' }}
                                  />
                                  <Bar dataKey="earnings" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="glass-card" style={{ padding: '0.75rem' }}>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fulfillment Status</span>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><CheckCircle2 size={10} style={{ color: 'var(--accent)' }} /> Fulfilled: <strong>{stockistAnalytics.total_fulfilled}</strong></span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}><AlertCircle size={10} style={{ color: 'var(--danger)' }} /> Cancelled: <strong>{stockistAnalytics.total_cancelled}</strong></span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                                  {stockistAnalytics.total_fulfilled + stockistAnalytics.total_cancelled > 0 ? (
                                    <>
                                      <div style={{ width: `${(stockistAnalytics.total_fulfilled / (stockistAnalytics.total_fulfilled + stockistAnalytics.total_cancelled)) * 100}%`, background: 'var(--accent)' }} />
                                      <div style={{ width: `${(stockistAnalytics.total_cancelled / (stockistAnalytics.total_fulfilled + stockistAnalytics.total_cancelled)) * 100}%`, background: 'var(--danger)' }} />
                                    </>
                                  ) : (
                                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="glass-card" style={{ padding: '0.75rem' }}>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Selling Products</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                              {stockistAnalytics.top_products.map((p, idx) => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', paddingBottom: '0.2rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                  <span style={{ color: 'white' }}>{idx + 1}. {p.name}</span>
                                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{p.qty} sold</span>
                                </div>
                              ))}
                              {stockistAnalytics.top_products.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center' }}>No products sold yet.</p>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>Loading analytics...</p>
                      )}
                    </div>
                  )}

                  <button className="btn btn-danger" style={{ width: '100%', marginTop: 'auto', fontSize: '0.8rem', minHeight: '36px', height: '36px' }} onClick={handleLogout}>Log Out</button>

                  {/* Stockist-Side Rate Customer Modal Overlay */}
                  {submittingFeedbackOrder && currentUser.role === 'STOCKIST' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '1.5rem', justifyContent: 'center' }}>
                      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <UserCheck size={16} style={{ color: 'var(--accent)' }} />
                          {t('Rate Customer', 'ग्राहक को रेट करें', 'ক্রেতাকে রেটিং দিন')}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {t('Rate behavior of', 'व्यवहार को रेट करें', 'ব্যবহারের রেটিং দিন')}: <strong>{submittingFeedbackOrder.customer_name}</strong>
                        </p>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {[1,2,3,4,5].map(star => (
                            <span 
                              key={star} 
                              style={{ fontSize: '1.5rem', cursor: 'pointer', color: star <= feedbackRating ? 'var(--warning)' : 'var(--text-muted)' }}
                              onClick={() => setFeedbackRating(star)}
                            >
                              ★
                            </span>
                          ))}
                        </div>

                        <div className="input-group">
                          <label className="input-label">{t('Details / Comment', 'विवरण / टिप्पणी', 'মন্তব্য / বিবরণ')}</label>
                          <textarea 
                            className="text-input" 
                            style={{ height: '60px', fontSize: '0.75rem' }} 
                            placeholder={t('e.g. Abusive behavior, pickup no-show', 'जैसे: अभद्र व्यवहार, पिकअप नो-शो', 'যেমন: খারাপ ব্যবহার বা পিকআপ করতে না আসা')}
                            value={feedbackReason}
                            onChange={e => setFeedbackReason(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <input 
                            type="checkbox" 
                            id="reportCustomerFlag" 
                            checked={reportFlag} 
                            onChange={e => setReportFlag(e.target.checked)} 
                          />
                          <label htmlFor="reportCustomerFlag" style={{ fontSize: '0.75rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                            {t('Report Customer for serious violation', 'गंभीर उल्लंघन के लिए रिपोर्ट करें', 'গুরুতর নিয়ম লঙ্ঘনের জন্য রিপোর্ট করুন')}
                          </label>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-accent" style={{ flex: 1 }} onClick={() => handleSaveFeedback('STOCKIST')}>
                            {t('Submit', 'जमा करें', 'জমা দিন')}
                          </button>
                          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setSubmittingFeedbackOrder(null); setReportFlag(false); }}>
                            {t('Cancel', 'रद्द करें', 'বাতিল')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showAddProductModal && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '1.5rem', justifyContent: 'center' }}>
                      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Package size={16} style={{ color: 'var(--accent)' }} />
                          {t('Add New SKU', 'नया SKU जोड़ें', 'নতুন SKU যোগ করুন')}
                        </h3>
                        
                        <div className="input-group">
                          <label className="input-label">{t('Product Name', 'उत्पाद का नाम', 'পণ্যের নাম')}</label>
                          <input type="text" className="text-input" value={newProdName} onChange={e => setNewProdName(e.target.value)} />
                        </div>
                        
                        <div className="input-group">
                          <label className="input-label">{t('Selling Price (₹)', 'विक्रय मूल्य (₹)', 'বিক্রয় মূল্য (₹)')}</label>
                          <input type="number" className="text-input" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} />
                        </div>
                        
                        <div className="input-group">
                          <label className="input-label">{t('Cost Price (₹)', 'लागत मूल्य (₹)', 'ক্রয় মূল্য (₹)')}</label>
                          <input type="number" className="text-input" value={newProdCostPrice} onChange={e => setNewProdCostPrice(e.target.value)} />
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block', marginTop: '0.2rem' }}>
                            {t('Points customers earn are based on your margin', 'ग्राहकों द्वारा अर्जित अंक आपके मार्जिन पर आधारित होते हैं', 'গ্রাহকদের অর্জিত পয়েন্ট আপনার মার্জিনের ওপর ভিত্তি করে নির্ধারিত হয়')}
                          </small>
                        </div>
                        
                        <div className="input-group">
                          <label className="input-label">{t('Category', 'श्रेणी', 'বিভাগ')}</label>
                          <select className="text-input" value={newProdCategory} onChange={e => setNewProdCategory(e.target.value)}>
                            <option value="groceries">{t('Groceries', 'किराना', 'মুদিখানা')}</option>
                            <option value="broadband">{t('Broadband', 'ब्रॉडबैंड', 'ব্রডব্যান্ড')}</option>
                            <option value="electronics">{t('Electronics', 'इलेक्ट्रॉनिक्स', 'ইলেকট্রনিক্স')}</option>
                            <option value="utilities">{t('Utilities', 'उपयोगिताएँ', 'ইউটিলিটি')}</option>
                          </select>
                        </div>
                        
                        <div className="input-group">
                          <label className="input-label">{t('Initial Stock', 'प्रारंभिक स्टॉक', 'প্রাথমিক স্টক')}</label>
                          <input type="number" className="text-input" value={newProdInitialStock} onChange={e => setNewProdInitialStock(e.target.value)} />
                        </div>

                        <div className="input-group">
                          <label className="input-label">
                            {t('Wholesale bill / invoice (photo)', 'थोक बिल / चालान (फोटो)', 'পাইকারি বিল / ইনভয়েস (ছবি)')} <span style={{ color: 'var(--danger)' }}>*</span>
                          </label>
                          <input 
                            type="file" 
                            accept=".jpg,.jpeg,.png,.webp"
                            className="text-input" 
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file && file.size > 8 * 1024 * 1024) {
                                showToast('Bill photo exceeds 8 MB limit', 'error');
                                return;
                              }
                              setNewProdBillFile(file || null);
                            }}
                          />
                          {newProdBillFile && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
                              Selected: {newProdBillFile.name} ({(newProdBillFile.size / 1024).toFixed(1)} KB)
                            </div>
                          )}
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
                            Upload a photo of the wholesaler's bill or invoice showing you paid the cost price for this stock. This helps us verify prices are honest. Bills are visible to admin and customers.
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button className="btn btn-accent" style={{ flex: 1 }} onClick={handleAddNewProduct}>
                            {t('Add Product', 'उत्पाद जोड़ें', 'পণ্য যোগ করুন')}
                          </button>
                          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddProductModal(false)}>
                            {t('Cancel', 'रद्द करें', 'বাতিল করুন')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {editingProduct && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '1.5rem', justifyContent: 'center' }}>
                      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Edit size={16} style={{ color: 'var(--accent)' }} />
                          {t('Edit SKU details', 'SKU विवरण संपादित करें', 'SKU বিবরণ সংশোধন করুন')}
                        </h3>

                        {(Math.abs(parseFloat(editProdPrice || 0) - editingProduct.price) > 0.001 || Math.abs(parseFloat(editProdCostPrice || 0) - editingProduct.cost_price) > 0.001) && (
                          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', color: '#fca5a5' }}>
                            ⚠️ Price change detected. A new bill is required.
                          </div>
                        )}
                        
                        <div className="input-group">
                          <label className="input-label">{t('Product Name', 'उत्पाद का नाम', 'পণ্যের নাম')}</label>
                          <input type="text" className="text-input" value={editProdName} onChange={e => setEditProdName(e.target.value)} />
                        </div>
                        
                        <div className="input-group">
                          <label className="input-label">{t('Selling Price (₹)', 'विक्रय मूल्य (₹)', 'বিক্রয় মূল্য (₹)')}</label>
                          <input type="number" className="text-input" value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)} />
                        </div>
                        
                        <div className="input-group">
                          <label className="input-label">{t('Cost Price (₹)', 'लागत मूल्य (₹)', 'ক্রয় মূল্য (₹)')}</label>
                          <input type="number" className="text-input" value={editProdCostPrice} onChange={e => setEditProdCostPrice(e.target.value)} />
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block', marginTop: '0.2rem' }}>
                            {t('Points customers earn are based on your margin', 'ग्राहकों द्वारा अर्जित अंक आपके मार्जिन पर आधारित होते हैं', 'গ্রাহকদের অর্জিত পয়েন্ট আপনার মার্জিনের ওপর ভিত্তি করে নির্ধারিত হয়')}
                          </small>
                        </div>

                        <div className="input-group">
                          <label className="input-label">
                            {t('Wholesale bill photo', 'थोक बिल फोटो', 'পাইকারি বিল ছবি')} {(Math.abs(parseFloat(editProdPrice || 0) - editingProduct.price) > 0.001 || Math.abs(parseFloat(editProdCostPrice || 0) - editingProduct.cost_price) > 0.001) && <span style={{ color: 'var(--danger)' }}>*</span>}
                          </label>
                          <input 
                            type="file" 
                            accept=".jpg,.jpeg,.png,.webp"
                            className="text-input" 
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file && file.size > 8 * 1024 * 1024) {
                                showToast('Bill photo exceeds 8 MB limit', 'error');
                                return;
                              }
                              setEditProdBillFile(file || null);
                            }}
                          />
                          {editProdBillFile && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
                              Selected: {editProdBillFile.name} ({(editProdBillFile.size / 1024).toFixed(1)} KB)
                            </div>
                          )}
                        </div>

                        <button 
                          type="button"
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}
                          onClick={() => {
                            setBillHistoryProduct(editingProduct);
                            fetch(`${API_BASE}/products/${editingProduct.id}/bill-history`)
                              .then(res => res.json())
                              .then(data => setBillHistoryData(data));
                            setShowBillHistoryModal(true);
                          }}
                        >
                          View bill history for this SKU
                        </button>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button className="btn btn-accent" style={{ flex: 1 }} onClick={handleSaveEditProduct}>
                            {t('Save Changes', 'परिवर्तन सहेजें', 'পরিবর্তন সংরক্ষণ করুন')}
                          </button>
                          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingProduct(null)}>
                            {t('Cancel', 'रद्द करें', 'বাতিল করুন')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="phone-footer">
                  <button className={`phone-nav-btn ${stockistActiveTab === 'orders' ? 'active' : ''}`} onClick={() => setStockistActiveTab('orders')}>
                    <ArrowRightLeft size={18} />
                    {t("Orders", "ऑर्डर", "অর্ডার")}
                  </button>
                  <button className={`phone-nav-btn ${stockistActiveTab === 'inventory' ? 'active' : ''}`} onClick={() => setStockistActiveTab('inventory')}>
                    <Package size={18} />
                    {t("Inventory", "इन्वेंट्री", "ইনভেন্টরি")}
                  </button>
                  <button className={`phone-nav-btn ${stockistActiveTab === 'analytics' ? 'active' : ''}`} onClick={() => { setStockistActiveTab('analytics'); loadStockistData(); }}>
                    <BarChart2 size={18} />
                    {t("Analytics", "विश्लेषण", "অ্যানালিটিক্স")}
                  </button>
                </div>
              </>

            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminView = () => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div className="perspective-banner">
            <span><Settings size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} /> OPERATOR PORTAL: FastNet Operations Dashboard</span>
          </div>
          <div className="phone-mockup" style={{ maxWidth: '420px', width: '100%' }}>
            <div className="phone-notch"></div>
            <div className="phone-screen" style={{ minHeight: '480px' }}>
              {renderAuthForm('admin')}
            </div>
          </div>
        </div>
      );
    }

    const refundDueCount = dbState?.orders?.filter(o => o.payment_status === 'REFUND_DUE').length || 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        <div className="perspective-banner">
          <span><Settings size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} /> OPERATOR PORTAL: FastNet Operations Dashboard</span>
        </div>

        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h1>Operator Admin Dashboard</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>FastNet Pilot Tenant Operations</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-danger" onClick={handleResetDb} style={{ fontSize: '0.8rem' }}>
                <RotateCcw size={14} /> Reset Database
              </button>
            </div>
          </div>

          {/* Shared Region Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <MapPin size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Region Filter:</span>
            <select 
              className="text-input" 
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', width: 'auto' }}
              value={adminRegionFilter}
              onChange={e => setAdminRegionFilter(e.target.value)}
            >
              <option value="ALL">All Regions</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="admin-grid">
            <div className="admin-sidebar">
              {/* Primary Top Section (Always Visible) */}
              <button className={`admin-nav-item ${adminTab === 'home' ? 'active' : ''}`} onClick={() => setAdminTab('home')}>
                <Home size={16} /> Home
              </button>
              <button className={`admin-nav-item ${adminTab === 'kyc' ? 'active' : ''}`} onClick={() => setAdminTab('kyc')}>
                <UserCheck size={16} /> Pending KYC {pendingKyc.length > 0 && <span className="badge badge-danger" style={{ marginLeft: '0.25rem', fontSize: '0.65rem' }}>{pendingKyc.length}</span>}
              </button>
              <button className={`admin-nav-item ${adminTab === 'stockists' ? 'active' : ''}`} onClick={() => setAdminTab('stockists')}>
                <Store size={16} /> Stockists
              </button>
              <button className={`admin-nav-item ${adminTab === 'redemption_approvals' ? 'active' : ''}`} onClick={() => { setAdminTab('redemption_approvals'); fetchRedemptionApprovals(); }}>
                <Gift size={16} /> Redemptions {adminRedemptionApprovals.filter(r => r.status === 'PENDING_ADMIN_APPROVAL').length > 0 && <span className="badge badge-danger" style={{ marginLeft: '0.25rem', fontSize: '0.65rem' }}>{adminRedemptionApprovals.filter(r => r.status === 'PENDING_ADMIN_APPROVAL').length}</span>}
              </button>
              <button className={`admin-nav-item ${adminTab === 'analytics' ? 'active' : ''}`} onClick={() => { setAdminTab('analytics'); fetchAnalytics(); localStorage.setItem('fastnet_admin_analytics_visited', 'true'); }}>
                <TrendingUp size={16} /> Analytics
              </button>
              <button className={`admin-nav-item ${adminTab === 'config' || adminTab === 'rates' ? 'active' : ''}`} onClick={() => setAdminTab('config')}>
                <Settings size={16} /> Config
              </button>

              {/* Collapsible Advanced Section */}
              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  className="admin-nav-item" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ fontWeight: '600', color: 'var(--text-muted)', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>{showAdvanced ? '▾ Advanced' : '▸ Advanced'}</span>
                </button>

                {showAdvanced && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.35rem', paddingLeft: '0.25rem' }}>
                    <button className={`admin-nav-item ${adminTab === 'customers' ? 'active' : ''}`} onClick={() => setAdminTab('customers')}>
                      <UserCheck size={16} /> All Customers ({adminCustomers.length})
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'partners' ? 'active' : ''}`} onClick={() => { setAdminTab('partners'); fetchAdminPartners(); }}>
                      <UserPlus size={16} /> All Partners ({adminPartners.length})
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'leads' ? 'active' : ''}`} onClick={() => { setAdminTab('leads'); fetchAdminPartners(); }}>
                      <UserPlus size={16} /> Partner Leads ({partnerLeads.length})
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'vendors' ? 'active' : ''}`} onClick={() => setAdminTab('vendors')}>
                      <ShoppingBag size={16} /> Wholesalers ({vendors.length})
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'regions' ? 'active' : ''}`} onClick={() => { setAdminTab('regions'); fetchAdminRegions(); }}>
                      <Globe size={16} /> Regions ({adminRegionsList.length})
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'redemptions' ? 'active' : ''}`} onClick={() => setAdminTab('redemptions')}>
                      <ArrowRightLeft size={16} /> Subscriber Bill Discounts ({pendingRedemptions.filter(r=>r.billing_sync_status==='PENDING').length})
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'fraud_reports' ? 'active' : ''}`} onClick={() => setAdminTab('fraud_reports')}>
                      <AlertTriangle size={16} /> Fraud Reports {adminFraudReports.filter(r=>['NEW','TRIAGING'].includes(r.status)).length > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.25rem', fontSize: '0.65rem' }}>{adminFraudReports.filter(r=>['NEW','TRIAGING'].includes(r.status)).length}</span>}
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'anomalies' ? 'active' : ''}`} onClick={() => setAdminTab('anomalies')}>
                      <ShieldAlert size={16} /> Flagged Store Orders ({anomalies.length})
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'bill_photos' ? 'active' : ''}`} onClick={() => { setAdminTab('bill_photos'); fetchAdminBillPhotos(); }}>
                      <FileText size={16} /> Bill Photos {adminBillPhotos.filter(b => b.flag_status === 'FLAGGED').length > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.25rem', fontSize: '0.65rem' }}>{adminBillPhotos.filter(b => b.flag_status === 'FLAGGED').length}</span>}
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'audit_log' ? 'active' : ''}`} onClick={() => setAdminTab('audit_log')}>
                      <FileText size={16} /> Audit Log
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'feedback' ? 'active' : ''}`} onClick={() => setAdminTab('feedback')}>
                      <ShieldAlert size={16} /> Feedback & Reports ({allFeedbackReports.length})
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'transactions' ? 'active' : ''}`} onClick={() => setAdminTab('transactions')}>
                      <ArrowRightLeft size={16} /> All Transactions {refundDueCount > 0 && <span className="badge badge-danger" style={{ marginLeft: '0.25rem', fontSize: '0.65rem' }}>{refundDueCount}</span>}
                    </button>
                    <button className={`admin-nav-item ${adminTab === 'health' ? 'active' : ''}`} onClick={() => { setAdminTab('health'); fetchHealthData(); }}>
                      <TrendingUp size={16} /> System Health
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-content">
              {/* Top 3 Admin Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div 
                  onClick={() => { setAdminTab('redemption_approvals'); fetchRedemptionApprovals(); }}
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                    {t('Redemptions Pending Admin Approval', 'प्रशासक अनुमोदन लंबित रिडीम', 'অ্যাডমিন অনুমোদনের অপেক্ষায় রিডিম')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                      {adminRedemptionApprovals.filter(r => r.status === 'PENDING_ADMIN_APPROVAL').length}
                    </span>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Pending</span>
                  </div>
                </div>

                <div 
                  onClick={() => setAdminTab('transactions')}
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                    {t('Orders In Progress Today', 'आज प्रगति में ऑर्डर', 'আজকের প্রসেসিংয়ে থাকা অর্ডার')}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.35rem' }}>
                    {analyticsData?.orders?.total_today || 0}
                  </div>
                </div>

                <div 
                  onClick={() => { setAdminTab('analytics'); fetchAnalytics(); }}
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                    {t('Revenue This Week', 'इस सप्ताह का राजस्व', 'এই সপ্তাহের মোট রাজস্ব')}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4ade80', marginTop: '0.35rem' }}>
                    ₹{analyticsData?.orders?.revenue_this_week_rupees || 0}
                  </div>
                </div>
              </div>

              {/* Round BF5d: Getting Started Guided Setup Checklist */}
              {(() => {
                const step1Done = regions.length > 0;
                const step2Done = vendors.length > 0;
                const allStks = adminStockists.length > 0 ? adminStockists : customerStockists;
                const step3Done = allStks.length > 0;
                const step4Done = adminCustomers.length > 0;

                const allComplete = step1Done && step2Done && step3Done && step4Done;
                if (allComplete) return null;

                return (
                  <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'rgba(99, 102, 241, 0.05)' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0, marginBottom: '0.35rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={16} /> {t('Getting Started — Initial Platform Setup', 'आरंभ करना — प्रारंभिक प्लेटफ़ॉर्म सेटअप', 'শুরু করুন — প্রাথমিক প্ল্যাটফর্ম সেটআপ')}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      {t('Follow these steps in order to set up your FastNet network.', 'अपने फास्टनेट नेटवर्क को सेट करने के लिए इन चरणों का पालन करें।', 'আপনার ফাস্টনেট নেটওয়ার্ক সেট আপ করতে নিচের ধাপগুলো অনুসরণ করুন।')}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {/* Step 1 */}
                      <div 
                        onClick={() => { setAdminTab('regions'); fetchAdminRegions(); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem', borderRadius: '8px',
                          background: step1Done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                          border: step1Done ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border-color)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {step1Done ? <CheckCircle2 size={16} style={{ color: '#4ade80' }} /> : <span style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '16px', textAlign: 'center' }}>1</span>}
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.85rem', color: step1Done ? '#4ade80' : 'white' }}>
                              1. {t('Create your first service region', 'अपना पहला सेवा क्षेत्र बनाएं', 'আপনার প্রথম পরিষেবা অঞ্চল তৈরি করুন')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Advanced → Regions</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Go →</span>
                      </div>

                      {/* Step 2 */}
                      <div 
                        onClick={step1Done ? () => setAdminTab('vendors') : undefined}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem', borderRadius: '8px',
                          background: step2Done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                          border: step2Done ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border-color)',
                          opacity: step1Done ? 1 : 0.4,
                          cursor: step1Done ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {step2Done ? <CheckCircle2 size={16} style={{ color: '#4ade80' }} /> : <span style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '16px', textAlign: 'center' }}>2</span>}
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.85rem', color: step2Done ? '#4ade80' : (step1Done ? 'white' : 'var(--text-muted)') }}>
                              2. {t('Register a wholesaler for that region', 'उस क्षेत्र के लिए थोक विक्रेता पंजीकृत करें', 'সেই অঞ্চলের জন্য একজন পাইকারী বিক্রেতা রেজিস্টার করুন')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Advanced → Wholesalers</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: step1Done ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {step1Done ? 'Go →' : 'Locked'}
                        </span>
                      </div>

                      {/* Step 3 */}
                      <div 
                        onClick={step2Done ? () => { setAdminTab('kyc'); fetchDbState(); } : undefined}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem', borderRadius: '8px',
                          background: step3Done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                          border: step3Done ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border-color)',
                          opacity: step2Done ? 1 : 0.4,
                          cursor: step2Done ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {step3Done ? <CheckCircle2 size={16} style={{ color: '#4ade80' }} /> : <span style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '16px', textAlign: 'center' }}>3</span>}
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.85rem', color: step3Done ? '#4ade80' : (step2Done ? 'white' : 'var(--text-muted)') }}>
                              3. {t('Wait for a shopkeeper to register, then approve them', 'दुकानदार के पंजीकरण की प्रतीक्षा करें, फिर उन्हें स्वीकृत करें', 'দোকানদারের নিবন্ধনের জন্য অপেক্ষা করুন, তারপর তাদের অনুমোদন করুন')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pending KYC</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: step2Done ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {step2Done ? 'Go →' : 'Locked'}
                        </span>
                      </div>

                      {/* Step 4 */}
                      <div 
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem', borderRadius: '8px',
                          background: step4Done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                          border: step4Done ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border-color)',
                          opacity: step3Done ? 1 : 0.4
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {step4Done ? <CheckCircle2 size={16} style={{ color: '#4ade80' }} /> : <span style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '16px', textAlign: 'center' }}>4</span>}
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.85rem', color: step4Done ? '#4ade80' : (step3Done ? 'white' : 'var(--text-muted)') }}>
                              4. {t('Invite customers to sign up', 'ग्राहकों को साइन अप करने के लिए आमंत्रित करें', 'গ্রাহকদের সাইন আপ করতে আমন্ত্রণ জানান')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {t('Customers can register via Customer App once a shopkeeper is active.', 'दुकानदार के सक्रिय होने पर ग्राहक ग्राहक ऐप के माध्यम से पंजीकरण कर सकते हैं।', 'একজন দোকানদার সক্রিয় হলে গ্রাহকরা কাস্টমার অ্যাপের মাধ্যমে নিবন্ধন করতে পারেন।')}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {step4Done ? 'Done' : (step3Done ? 'Pending' : 'Locked')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {adminTab === 'analytics' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Analytics Dashboard</h2>
                      {analyticsData?.generated_at && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Last updated: {new Date(analyticsData.generated_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={fetchAnalytics}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>

                  {analyticsLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading analytics data...</div>
                  ) : analyticsError ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>Could not load analytics. Tap Refresh to retry.</div>
                  ) : analyticsData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Section 1: Users Overview */}
                      <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Users Overview</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Customers</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>{analyticsData.users?.total_customers || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Approved Stockists</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4ade80' }}>{analyticsData.users?.total_stockists_approved || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Active Partners</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#818cf8' }}>{analyticsData.users?.total_partners_active || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DAU / WAU / MAU</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>
                              {analyticsData.users?.dau_customers || 0} / {analyticsData.users?.wau_customers || 0} / {analyticsData.users?.mau_customers || 0}
                            </div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>New Customers (Week / Month)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>
                              {analyticsData.users?.new_customers_this_week || 0} / {analyticsData.users?.new_customers_this_month || 0}
                            </div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Customers With Bindings</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f472b6' }}>{analyticsData.users?.customers_with_bindings || 0}</div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Orders & Revenue */}
                      <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Orders & Revenue</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Orders All-time</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>{analyticsData.orders?.total_all_time || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Revenue Today / Week / Month</div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#4ade80' }}>
                              ₹{analyticsData.orders?.revenue_today_rupees || 0} / ₹{analyticsData.orders?.revenue_this_week_rupees || 0} / ₹{analyticsData.orders?.revenue_this_month_rupees || 0}
                            </div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Average Order Value (Month)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#38bdf8' }}>₹{analyticsData.orders?.average_order_value_this_month || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Orders Status Breakdown</div>
                            <div style={{ fontSize: '0.75rem', color: 'white', marginTop: '0.2rem' }}>
                              Pending: <strong>{analyticsData.orders?.orders_pending || 0}</strong> | Ready: <strong>{analyticsData.orders?.orders_ready || 0}</strong> | Delivered Week: <strong>{analyticsData.orders?.orders_delivered_this_week || 0}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Redemptions & Payouts */}
                      <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Redemptions & Partner Payouts</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Approvals All-time</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>{analyticsData.redemptions?.total_approvals_all_time || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pending Admin Approval</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--warning)' }}>{analyticsData.redemptions?.pending_approvals || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Points Redeemed (Month)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#c084fc' }}>{analyticsData.redemptions?.total_points_redeemed_this_month || 0} pts</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Partner Payout Owed (Month 88%)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4ade80' }}>₹{analyticsData.redemptions?.total_partner_payout_owed_this_month || 0}</div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Points Ledgers */}
                      <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Points Ledger Breakdown</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Points Issued All-time</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4ade80' }}>{analyticsData.points?.total_points_issued_all_time || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Points Redeemed All-time</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f43f5e' }}>{analyticsData.points?.total_points_redeemed_all_time || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Points Outstanding</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fbbf24' }}>{analyticsData.points?.total_points_outstanding || 0}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Referral Bonuses Paid</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#818cf8' }}>{analyticsData.points?.total_referral_bonuses_paid || 0} pts</div>
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Top Stockists & Partners Tables */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Top 5 Stockists by GMV (This Month)</h3>
                          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '0.35rem' }}>Stockist</th>
                                <th style={{ padding: '0.35rem' }}>Region</th>
                                <th style={{ padding: '0.35rem' }}>GMV</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(analyticsData.stockists?.top_5_by_gmv_this_month || []).map((s, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                                  <td style={{ padding: '0.35rem', fontWeight: 'bold' }}>{s.name}</td>
                                  <td style={{ padding: '0.35rem', color: 'var(--text-muted)' }}>{s.region}</td>
                                  <td style={{ padding: '0.35rem', color: '#4ade80', fontWeight: 'bold' }}>₹{s.gmv}</td>
                                </tr>
                              ))}
                              {(analyticsData.stockists?.top_5_by_gmv_this_month || []).length === 0 && (
                                <tr><td colSpan="3" style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>No stockist sales this month.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div>
                          <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Top 5 Partners by Redemptions</h3>
                          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '0.35rem' }}>Partner</th>
                                <th style={{ padding: '0.35rem' }}>Redemptions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(analyticsData.partners?.top_5_by_redemptions_this_month || []).map((p, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                                  <td style={{ padding: '0.35rem', fontWeight: 'bold' }}>{p.name}</td>
                                  <td style={{ padding: '0.35rem', color: '#818cf8', fontWeight: 'bold' }}>{p.count}</td>
                                </tr>
                              ))}
                              {(analyticsData.partners?.top_5_by_redemptions_this_month || []).length === 0 && (
                                <tr><td colSpan="2" style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>No partner redemptions this month.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Could not load analytics. Tap Refresh to retry.</div>
                  )}
                </div>
              )}
              
              {adminTab === 'customers' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>All Customers</h2>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Search by name or phone..." 
                        className="text-input" 
                        style={{ width: '220px', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} 
                        value={adminCustomerSearch}
                        onChange={e => setAdminCustomerSearch(e.target.value)}
                      />
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={adminIncludeInactiveCustomers} 
                          onChange={e => setAdminIncludeInactiveCustomers(e.target.checked)} 
                        />
                        Show Deactivated
                      </label>
                    </div>
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Region</th>
                        <th>Points Balance</th>
                        <th>Total Orders</th>
                        <th>Joined Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminCustomers
                        .filter(c => adminRegionFilter === 'ALL' || c.region_id === adminRegionFilter)
                        .filter(c => adminIncludeInactiveCustomers ? true : c.is_active !== false)
                        .filter(c => (c.name || '').toLowerCase().includes(adminCustomerSearch.toLowerCase()) || (c.phone || '').includes(adminCustomerSearch))
                        .map(c => (
                          <tr key={c.id} style={c.is_active === false ? { opacity: 0.6, background: 'rgba(255,255,255,0.02)' } : {}}>
                            <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                            <td>{c.phone}</td>
                            <td>{regions.find(r => r.id === c.region_id)?.name || c.region_id}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{formatPoints(c.points_balance || 0)}</td>
                            <td>{c.total_orders || 0}</td>
                            <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</td>
                            <td>
                              <span className={`badge ${c.is_active !== false ? 'badge-success' : 'badge-secondary'}`}>
                                {c.is_active !== false ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={async () => {
                                  const res = await fetch(`${API_BASE}/admin/customers/${c.id}`);
                                  if (res.ok) setSelectedCustomerDetail(await res.json());
                                }}>
                                  Details
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => {
                                  setSelectedCustomerDetail(c); setEditCustomerName(c.name || ''); setEditCustomerEmail(c.email || ''); setShowEditCustomerModal(true);
                                }}>
                                  Edit
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => {
                                  setSelectedCustomerDetail(c); setChangePhoneNewNumber(c.phone || ''); setShowChangePhoneModal(true);
                                }}>
                                  Change Phone
                                </button>
                                <button className="btn btn-accent" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => {
                                  setSelectedCustomerDetail(c); setPointsCreditAmount(''); setPointsCreditReason(''); setShowPointsCreditModal(true);
                                }}>
                                  + Points
                                </button>
                                <button className={`btn ${c.is_active !== false ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => handleToggleCustomerDeactivate(c)}>
                                  {c.is_active !== false ? 'Deactivate' : 'Reactivate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'stockists' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>All Stockists</h2>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={adminIncludeInactiveStockists} 
                          onChange={e => setAdminIncludeInactiveStockists(e.target.checked)} 
                        />
                        Show Inactive
                      </label>
                      <button className="btn btn-accent" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setShowCreateStockistModal(true)}>
                        + Add New Stockist
                      </button>
                    </div>
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name / Shop</th>
                        <th>Region</th>
                        <th>Vendor</th>
                        <th>Commission Rate</th>
                        <th>30d Earnings (GMV)</th>
                        <th>Pending Orders</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminStockists
                        .filter(s => adminRegionFilter === 'ALL' || s.region_id === adminRegionFilter)
                        .filter(s => adminIncludeInactiveStockists ? true : s.is_active !== false)
                        .map(s => {
                          const vName = vendors.find(v => v.id === s.vendor_id)?.name || s.vendor_id || 'N/A';
                          return (
                            <tr key={s.id} style={s.is_active === false ? { opacity: 0.6, background: 'rgba(255,255,255,0.02)' } : {}}>
                              <td style={{ fontWeight: 'bold' }}>{s.name}</td>
                              <td>{regions.find(r => r.id === s.region_id)?.name || s.region_id}</td>
                              <td>{vName}</td>
                              <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{s.commission_rate}%</td>
                              <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₹{(s.gmv_30d || 0).toFixed(2)}</td>
                              <td>{s.pending_orders_count || 0}</td>
                              <td>
                                <span className={`badge ${s.is_active !== false ? 'badge-success' : 'badge-secondary'}`}>
                                  {s.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={async () => {
                                    const res = await fetch(`${API_BASE}/admin/stockists/${s.id}`);
                                    if (res.ok) setSelectedStockistDetail(await res.json());
                                  }}>
                                    Details
                                  </button>
                                  <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => {
                                    setSelectedStockistDetail(s); setEditStkName(s.name); setEditStkAddress(s.address || ''); setEditStkOpen(s.opening_time || '08:00'); setEditStkClose(s.closing_time || '20:00'); setEditStkEta(s.prep_eta_minutes || 15); setEditStkRadius(s.delivery_radius_km || 3.0); setShowEditStockistModal(true);
                                  }}>
                                    Edit
                                  </button>
                                  <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => {
                                    setSelectedStockistDetail(s); setNewCommissionRate(s.commission_rate.toString()); setCommissionRatePreview(null); setCommissionTypedConfirm(''); setShowCommissionRateModal(true);
                                  }}>
                                    Commission
                                  </button>
                                  <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={async () => {
                                    setSelectedStockistDetail(s); setNewStockistRegion(s.region_id);
                                    const ordersRes = await fetch(`${API_BASE}/orders?stockistId=${s.id}`);
                                    if (ordersRes.ok) {
                                      const oList = await ordersRes.json();
                                      setStockistBindingsCount(new Set(oList.map(ord => ord.customer_id)).size);
                                    }
                                    setShowStockistRegionModal(true);
                                  }}>
                                    Region
                                  </button>
                                  <button className={`btn ${s.is_active !== false ? 'btn-warning' : 'btn-secondary'}`} style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => handleToggleStockistDeactivate(s)}>
                                    {s.is_active !== false ? 'Deactivate' : 'Reactivate'}
                                  </button>
                                  {s.hasOrders ? (
                                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', opacity: 0.4, cursor: 'not-allowed' }} title="Cannot delete: stockist has order history. Deactivate instead." disabled>
                                      Delete
                                    </button>
                                  ) : (
                                    <button className="btn btn-danger" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => handleDeleteStockist(s)}>
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'health' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>System Health Dashboard</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Key operational health indicators across customer redemptions, partner fulfillment, stockist volume, and platform fraud signals.
                  </p>

                  {pendingKyc.length > 0 && (
                    <div
                      className="glass-card alert-kyc-pending"
                      style={{
                        marginBottom: '1.5rem',
                        padding: '0.85rem 1.25rem',
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => { setAdminTab('kyc'); fetchDbState(); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        <span>⚠️ {pendingKyc.length} stockists awaiting KYC approval</span>
                      </div>
                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setAdminTab('kyc'); fetchDbState(); }}>
                        Review & Approve KYC Queue →
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>4.1 Redemption Pipeline</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>Pending Admin Approval &gt; 24h:</span>
                          <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>{healthData?.redemption_pipeline?.pending_over_24h_count || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>Approved Awaiting Partner &gt; 48h:</span>
                          <span className="badge badge-danger" style={{ fontSize: '0.8rem' }}>{healthData?.redemption_pipeline?.approved_over_48h_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>4.4 New Arrivals (Last 30 Days)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>New Stockists Onboarded:</span>
                          <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--accent)' }}>{healthData?.new_arrivals?.new_stockists_30d || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>New Partners Onboarded:</span>
                          <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--accent)' }}>{healthData?.new_arrivals?.new_partners_30d || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>4.6 System Stats</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div>Customers: <strong>{healthData?.system_stats?.total_customers || 0}</strong></div>
                        <div>Stockists: <strong>{healthData?.system_stats?.total_stockists || 0}</strong></div>
                        <div>Partners: <strong>{healthData?.system_stats?.total_onboarded_partners || 0}</strong></div>
                        <div>Redemptions: <strong>{healthData?.system_stats?.total_redemption_approvals || 0}</strong></div>
                        <div>Ledger Entries: <strong>{healthData?.system_stats?.total_ledger_entries || 0}</strong></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>4.2 Partner Fulfillment Speed (Slowest First, Top 10)</h4>
                      <table className="admin-table" style={{ fontSize: '0.75rem' }}>
                        <thead>
                          <tr>
                            <th>Partner Name</th>
                            <th>Median Hours (Approve → Fulfill)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(healthData?.partner_fulfillment_speed || []).map(p => (
                            <tr key={p.partner_id}>
                              <td>{p.partner_name}</td>
                              <td style={{ fontWeight: 'bold', color: p.median_hours > 48 ? 'var(--danger)' : 'var(--accent)' }}>{p.median_hours} hrs</td>
                            </tr>
                          ))}
                          {(!healthData?.partner_fulfillment_speed || healthData.partner_fulfillment_speed.length === 0) && (
                            <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No fulfillment history yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>4.3 Stockist Volume Leaderboard (30d GMV)</h4>
                      <table className="admin-table" style={{ fontSize: '0.75rem' }}>
                        <thead>
                          <tr>
                            <th>Stockist Name</th>
                            <th>Region</th>
                            <th>30d GMV (Subtotal Sum)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(healthData?.stockist_volume_leaderboard || []).map(s => (
                            <tr key={s.stockist_id}>
                              <td>{s.stockist_name}</td>
                              <td>{s.region_id === 'r1' ? 'Kolkata South' : 'Rural Bishnupur'}</td>
                              <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹{(s.gmv_30d || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                          {(!healthData?.stockist_volume_leaderboard || healthData.stockist_volume_leaderboard.length === 0) && (
                            <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No stockist GMV data yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1rem', marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>4.5 Active Fraud Signals (NEW / TRIAGING)</h4>
                    <table className="admin-table" style={{ fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th>Entity Type</th>
                          <th>Entity ID / Name</th>
                          <th>Active Fraud Reports</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(healthData?.fraud_signals || []).map((f, idx) => (
                          <tr key={idx}>
                            <td><span className="badge badge-warning">{f.entity_type}</span></td>
                            <td>{f.entity_name || f.entity_id}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{f.active_reports_count}</td>
                          </tr>
                        ))}
                        {(!healthData?.fraud_signals || healthData.fraud_signals.length === 0) && (
                          <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active fraud signals.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(adminTab === 'partners' || adminTab === 'leads') && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>All Partners Management</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className={`btn ${partnerSubTab === 'leads' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPartnerSubTab('leads')}>
                        Partner Leads ({partnerLeads.length})
                      </button>
                      <button className={`btn ${partnerSubTab === 'onboarded' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setPartnerSubTab('onboarded'); fetchAdminPartners(); }}>
                        Onboarded Partners ({adminPartners.length})
                      </button>
                    </div>
                  </div>

                  {partnerSubTab === 'leads' && (
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Partner lead inquiries submitted from local cable operators and internet service providers.
                      </p>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Lead ID</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Business Name</th>
                            <th>City / Service</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partnerLeads.map(lead => (
                            <tr key={lead.id}>
                              <td style={{ fontFamily: 'monospace' }}>{lead.id}</td>
                              <td>{lead.name}</td>
                              <td>{lead.phone}</td>
                              <td>{lead.business_name || 'N/A'}</td>
                              <td>{lead.city || 'Kolkata'} / {lead.service_type || 'CABLE'}</td>
                              <td>
                                <span className={`badge ${lead.status === 'ONBOARDED' ? 'badge-success' : lead.status === 'CONTACTED' ? 'badge-primary' : 'badge-warning'}`}>
                                  {lead.status || 'NEW'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  {lead.status !== 'ONBOARDED' && (
                                    <button className="btn btn-accent" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => openPromoteLeadModal(lead)}>
                                      Promote to Partner
                                    </button>
                                  )}
                                  {lead.status === 'ONBOARDED' && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>Onboarded</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {partnerLeads.length === 0 && (
                            <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No partner leads submitted.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {partnerSubTab === 'onboarded' && (
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Onboarded cable and broadband partners providing bill discount redemption packages.
                      </p>

                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.35rem' }}>Region:</label>
                          <select className="text-input" style={{ width: 'auto', fontSize: '0.75rem', padding: '0.25rem' }} value={partnerRegionFilter} onChange={e => setPartnerRegionFilter(e.target.value)}>
                            <option value="ALL">All Regions</option>
                            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.35rem' }}>Service:</label>
                          <select className="text-input" style={{ width: 'auto', fontSize: '0.75rem', padding: '0.25rem' }} value={partnerServiceFilter} onChange={e => setPartnerServiceFilter(e.target.value)}>
                            <option value="ALL">All Services</option>
                            <option value="CABLE">Cable TV</option>
                            <option value="BROADBAND">Broadband</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.35rem' }}>Active Status:</label>
                          <select className="text-input" style={{ width: 'auto', fontSize: '0.75rem', padding: '0.25rem' }} value={partnerActiveFilter} onChange={e => setPartnerActiveFilter(e.target.value)}>
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="INACTIVE">Inactive Only</option>
                          </select>
                        </div>
                      </div>

                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Partner Name</th>
                            <th>Contact Phone</th>
                            <th>Services</th>
                            <th>Regions</th>
                            <th>Packages</th>
                            <th>Bound Customers</th>
                            <th>Status</th>
                            <th>Onboarded Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminPartners
                            .filter(p => partnerServiceFilter === 'ALL' || (p.service_types || []).includes(partnerServiceFilter))
                            .filter(p => partnerActiveFilter === 'ALL' ? true : partnerActiveFilter === 'ACTIVE' ? p.is_active !== false : p.is_active === false)
                            .map(p => (
                              <tr key={p.id} style={p.is_active === false ? { opacity: 0.6, background: 'rgba(255,255,255,0.02)' } : {}}>
                                <td style={{ fontWeight: 'bold' }}>{p.display_name} <br/><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.legal_name}</span></td>
                                <td>{p.contact_phone}</td>
                                <td>{(p.service_types || []).join(', ')}</td>
                                <td>{(p.regions || []).length}</td>
                                <td>{(p.packages || []).length}</td>
                                <td>{p.bound_customers_count || 0}</td>
                                <td><span className={`badge ${p.is_active !== false ? 'badge-success' : 'badge-secondary'}`}>{p.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                                <td style={{ fontSize: '0.7rem' }}>{p.onboarded_at ? new Date(p.onboarded_at).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={async () => {
                                      const res = await fetch(`${API_BASE}/admin/partners/${p.id}`);
                                      if (res.ok) setSelectedPartnerDetail(await res.json());
                                      else setSelectedPartnerDetail(p);
                                    }}>
                                      Details
                                    </button>
                                    <button className={`btn ${p.is_active !== false ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={async () => {
                                      const endpoint = p.is_active !== false ? 'deactivate' : 'reactivate';
                                      await fetch(`${API_BASE}/admin/partners/${p.id}/${endpoint}`, { method: 'POST' });
                                      fetchAdminPartners();
                                    }}>
                                      {p.is_active !== false ? 'Deactivate' : 'Reactivate'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {adminPartners.length === 0 && (
                            <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No onboarded partners found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'redemption_approvals' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Redemption Approvals Queue</h2>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className={`btn ${redemptionApprovalSubTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => setRedemptionApprovalSubTab('pending')}>
                        Pending ({adminRedemptionApprovals.filter(r => r.status === 'PENDING_ADMIN_APPROVAL').length})
                      </button>
                      <button className={`btn ${redemptionApprovalSubTab === 'approved' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => setRedemptionApprovalSubTab('approved')}>
                        Approved ({adminRedemptionApprovals.filter(r => r.status === 'APPROVED_AWAITING_PARTNER').length})
                      </button>
                      <button className={`btn ${redemptionApprovalSubTab === 'fulfilled' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => setRedemptionApprovalSubTab('fulfilled')}>
                        Fulfilled ({adminRedemptionApprovals.filter(r => r.status === 'FULFILLED').length})
                      </button>
                      <button className={`btn ${redemptionApprovalSubTab === 'rejected_disputed' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => setRedemptionApprovalSubTab('rejected_disputed')}>
                        Rejected / Disputed ({adminRedemptionApprovals.filter(r => ['REJECTED', 'DISPUTED'].includes(r.status)).length})
                      </button>
                    </div>
                  </div>

                  {redemptionApprovalSubTab === 'pending' && (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Partner</th>
                          <th>Package</th>
                          <th>Face Value</th>
                          <th>Points Deducted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminRedemptionApprovals.filter(r => r.status === 'PENDING_ADMIN_APPROVAL').map(r => (
                          <tr key={r.id}>
                            <td style={{ fontSize: '0.7rem' }}>{new Date(r.created_at).toLocaleString()}</td>
                            <td style={{ fontWeight: 'bold' }}>{r.customer_name}<br/><span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{r.customer_phone}</span></td>
                            <td>{r.partner_name}</td>
                            <td>{r.package_name}</td>
                            <td>₹{r.face_value_rupees}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{formatPoints(r.points_deducted)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button className="btn btn-accent" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => { setSelectedRedemptionToApprove(r); setApproveNotes(''); setShowApproveRedemptionModal(true); }}>
                                  Approve
                                </button>
                                <button className="btn btn-danger" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => { setSelectedRedemptionToReject(r); setRejectReason(''); setShowRejectRedemptionModal(true); }}>
                                  Reject
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={async () => {
                                  const res = await fetch(`${API_BASE}/admin/redemption-approvals/${r.id}`);
                                  if (res.ok) setSelectedRedemptionDetail(await res.json());
                                }}>
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {adminRedemptionApprovals.filter(r => r.status === 'PENDING_ADMIN_APPROVAL').length === 0 && (
                          <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No pending redemption approvals.</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {redemptionApprovalSubTab === 'approved' && (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Approved Date</th>
                          <th>Customer</th>
                          <th>Partner</th>
                          <th>Package</th>
                          <th>Face Value</th>
                          <th>Points</th>
                          <th>Status</th>
                          <th>Admin ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminRedemptionApprovals.filter(r => r.status === 'APPROVED_AWAITING_PARTNER').map(r => (
                          <tr key={r.id}>
                            <td style={{ fontSize: '0.7rem' }}>{r.approved_at ? new Date(r.approved_at).toLocaleString() : 'N/A'}</td>
                            <td>{r.customer_name}</td>
                            <td>{r.partner_name}</td>
                            <td>{r.package_name}</td>
                            <td>₹{r.face_value_rupees}</td>
                            <td>{formatPoints(r.points_deducted)}</td>
                            <td><span className="badge badge-primary">AWAITING PARTNER</span></td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{r.admin_id}</td>
                          </tr>
                        ))}
                        {adminRedemptionApprovals.filter(r => r.status === 'APPROVED_AWAITING_PARTNER').length === 0 && (
                          <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No approved redemptions awaiting partner action.</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {redemptionApprovalSubTab === 'fulfilled' && (
                    <div>
                      <div style={{ marginBottom: '1rem' }}>
                        <input type="text" placeholder="Search by customer name or phone..." className="text-input" style={{ width: '250px', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} value={fulfilledSearchText} onChange={e => setFulfilledSearchText(e.target.value)} />
                      </div>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Fulfilled Date</th>
                            <th>Customer</th>
                            <th>Partner</th>
                            <th>Package</th>
                            <th>Face Value</th>
                            <th>Points</th>
                            <th>Partner Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminRedemptionApprovals
                            .filter(r => r.status === 'FULFILLED')
                            .filter(r => !fulfilledSearchText || (r.customer_name || '').toLowerCase().includes(fulfilledSearchText.toLowerCase()) || (r.customer_phone || '').includes(fulfilledSearchText))
                            .map(r => (
                              <tr key={r.id}>
                                <td style={{ fontSize: '0.7rem' }}>{r.fulfilled_at ? new Date(r.fulfilled_at).toLocaleString() : 'N/A'}</td>
                                <td>{r.customer_name}</td>
                                <td>{r.partner_name}</td>
                                <td>{r.package_name}</td>
                                <td>₹{r.face_value_rupees}</td>
                                <td>{formatPoints(r.points_deducted)}</td>
                                <td style={{ fontSize: '0.7rem' }}>{r.partner_notes || 'N/A'}</td>
                              </tr>
                            ))}
                          {adminRedemptionApprovals.filter(r => r.status === 'FULFILLED').length === 0 && (
                            <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No fulfilled redemptions recorded.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {redemptionApprovalSubTab === 'rejected_disputed' && (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Partner</th>
                          <th>Package</th>
                          <th>Status</th>
                          <th>Reason / Details</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminRedemptionApprovals.filter(r => ['REJECTED', 'DISPUTED'].includes(r.status)).map(r => (
                          <tr key={r.id} style={r.status === 'DISPUTED' ? { background: 'rgba(234, 179, 8, 0.08)' } : {}}>
                            <td style={{ fontSize: '0.7rem' }}>{new Date(r.updated_at || r.created_at).toLocaleString()}</td>
                            <td>{r.customer_name}</td>
                            <td>{r.partner_name}</td>
                            <td>{r.package_name}</td>
                            <td><span className={`badge ${r.status === 'DISPUTED' ? 'badge-warning' : 'badge-danger'}`}>{r.status}</span></td>
                            <td style={{ fontSize: '0.7rem', maxWidth: '250px' }}>
                              {r.status === 'DISPUTED' ? r.disputed_reason : r.rejected_reason}
                            </td>
                            <td>
                              {r.status === 'DISPUTED' && (
                                <button className="btn btn-warning" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => { setSelectedRedemptionToResolve(r); setResolveOutcome('fulfill'); setResolveNotes(''); setShowResolveDisputeModal(true); }}>
                                  Resolve Dispute
                                </button>
                              )}
                              {r.status === 'REJECTED' && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Points Refunded</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {adminRedemptionApprovals.filter(r => ['REJECTED', 'DISPUTED'].includes(r.status)).length === 0 && (
                          <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No rejected or disputed redemptions.</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {adminTab === 'fraud_reports' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Fraud Reports Queue</h2>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {['NEW', 'TRIAGING', 'RESOLVED', 'DISMISSED'].map(st => {
                        const cnt = adminFraudReports.filter(r => r.status === st).length;
                        return (
                          <button 
                            key={st}
                            className={`btn ${fraudReportTab === st ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            onClick={() => setFraudReportTab(st)}
                          >
                            {st} ({cnt})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Submitted</th>
                        <th>Reporter ID</th>
                        <th>Subject</th>
                        <th>Linked Entity</th>
                        <th>Description Preview</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminFraudReports
                        .filter(r => r.status === fraudReportTab)
                        .map(r => (
                          <tr key={r.id}>
                            <td>{new Date(r.created_at).toLocaleString()}</td>
                            <td style={{ fontFamily: 'monospace' }}>{r.reporter_customer_id}</td>
                            <td style={{ fontWeight: 'bold' }}>{r.subject}</td>
                            <td>{r.linked_entity_type ? `${r.linked_entity_type}:${r.linked_entity_id}` : 'None'}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {r.description}
                            </td>
                            <td>
                              <span className={`badge ${r.status === 'NEW' ? 'badge-warning' : r.status === 'TRIAGING' ? 'badge-primary' : r.status === 'RESOLVED' ? 'badge-success' : 'badge-secondary'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} onClick={() => {
                                setSelectedFraudReportDetail(r); setFraudReportAdminNotes(r.admin_notes || '');
                              }}>
                                Review & Action
                              </button>
                            </td>
                          </tr>
                        ))}
                      {adminFraudReports.filter(r => r.status === fraudReportTab).length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No reports in {fraudReportTab} status.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'bill_photos' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>SKU Bill Photos Audit Queue</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Total Uploaded Bills: {adminBillPhotos.length}
                    </span>
                  </div>

                  {/* Filter Controls */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Flag Status:</label>
                      <select 
                        className="text-input" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', width: '130px' }}
                        value={billPhotoFlagFilter}
                        onChange={e => setBillPhotoFlagFilter(e.target.value)}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="CLEAN">CLEAN</option>
                        <option value="FLAGGED">FLAGGED</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Stockist:</label>
                      <select 
                        className="text-input" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', width: '160px' }}
                        value={billPhotoStockistFilter}
                        onChange={e => setBillPhotoStockistFilter(e.target.value)}
                      >
                        <option value="ALL">All Stockists</option>
                        {adminStockists.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>From Date:</label>
                      <input 
                        type="date" 
                        className="text-input"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: '130px' }}
                        value={billPhotoDateFrom}
                        onChange={e => setBillPhotoDateFrom(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>To Date:</label>
                      <input 
                        type="date" 
                        className="text-input"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: '130px' }}
                        value={billPhotoDateTo}
                        onChange={e => setBillPhotoDateTo(e.target.value)}
                      />
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={fetchAdminBillPhotos}>
                        Apply Filters
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Uploaded Date</th>
                        <th>Stockist</th>
                        <th>Product</th>
                        <th>Selling Price</th>
                        <th>Cost Price</th>
                        <th>Status</th>
                        <th>Preview</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminBillPhotos
                        .filter(b => billPhotoFlagFilter === 'ALL' || b.flag_status === billPhotoFlagFilter)
                        .filter(b => billPhotoStockistFilter === 'ALL' || b.stockist_id === billPhotoStockistFilter)
                        .map(b => (
                          <tr key={b.id}>
                            <td style={{ fontSize: '0.75rem' }}>{formatBillDate(b.uploaded_at || b.created_at)}</td>
                            <td style={{ fontWeight: 'bold' }}>{b.stockist_name || b.stockist_id}</td>
                            <td>{b.product_name || b.product_id}</td>
                            <td style={{ fontWeight: 'bold' }}>{formatBillPrice(b.selling_price_at_upload ?? b.declared_price)}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{formatBillPrice(b.cost_price_at_upload ?? b.declared_cost_price)}</td>
                            <td>
                              <span className={`badge ${b.flag_status === 'FLAGGED' ? 'badge-danger' : b.flag_status === 'RESOLVED' ? 'badge-primary' : 'badge-success'}`}>
                                {b.flag_status}
                              </span>
                            </td>
                            <td>
                              {billImgErrors[b.id] ? (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Image unavailable</span>
                              ) : (
                                <img 
                                  src={b.r2_key ? `${API_BASE}/bills/${b.r2_key}` : b.public_url} 
                                  alt="Bill thumbnail" 
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                                  onClick={() => setViewingBillModal(b)}
                                  onError={() => setBillImgErrors(prev => ({ ...prev, [b.id]: true }))}
                                />
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                {b.flag_status !== 'FLAGGED' && (
                                  <button className="btn btn-warning" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} onClick={() => { setFlaggingBill(b); setFlagReasonText(''); setShowFlagBillModal(true); }}>
                                    Flag Bill
                                  </button>
                                )}
                                {b.flag_status === 'FLAGGED' && (
                                  <button className="btn btn-success" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} onClick={() => { setUnflaggingBill(b); setShowUnflagBillModal(true); }}>
                                    Mark Resolved
                                  </button>
                                )}
                                <button className="btn btn-secondary" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} onClick={() => handleViewSignedUrl(b)}>
                                  Private Link
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {adminBillPhotos.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No bill photos found for selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'audit_log' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Admin Audit Log</h2>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                    <input 
                      type="text" 
                      placeholder="Filter by Admin ID..." 
                      className="text-input" 
                      style={{ width: '180px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} 
                      value={auditFilterAdmin} 
                      onChange={e => setAuditFilterAdmin(e.target.value)} 
                    />
                    <input 
                      type="text" 
                      placeholder="Filter by Entity Type..." 
                      className="text-input" 
                      style={{ width: '180px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} 
                      value={auditFilterEntityType} 
                      onChange={e => setAuditFilterEntityType(e.target.value)} 
                    />
                    <input 
                      type="text" 
                      placeholder="Filter by Action..." 
                      className="text-input" 
                      style={{ width: '180px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} 
                      value={auditFilterAction} 
                      onChange={e => setAuditFilterAction(e.target.value)} 
                    />
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Admin User</th>
                        <th>Action</th>
                        <th>Entity Type</th>
                        <th>Entity ID</th>
                        <th>Reason</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminAuditLogs
                        .filter(log => !auditFilterAdmin || (log.admin_user_id || '').toLowerCase().includes(auditFilterAdmin.toLowerCase()))
                        .filter(log => !auditFilterEntityType || (log.entity_type || '').toLowerCase().includes(auditFilterEntityType.toLowerCase()))
                        .filter(log => !auditFilterAction || (log.action || '').toLowerCase().includes(auditFilterAction.toLowerCase()))
                        .map(log => (
                          <tr key={log.id}>
                            <td style={{ fontSize: '0.7rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                            <td style={{ fontWeight: 'bold' }}>{log.admin_user_id}</td>
                            <td><span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{log.action}</span></td>
                            <td>{log.entity_type}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.entity_id}</td>
                            <td style={{ fontSize: '0.75rem' }}>{log.reason || 'N/A'}</td>
                            <td style={{ fontSize: '0.65rem', fontFamily: 'monospace', maxWidth: '250px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {JSON.stringify({ before: log.before, after: log.after })}
                            </td>
                          </tr>
                        ))}
                      {adminAuditLogs.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No audit log entries recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'kyc' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Pending KYC Approvals</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Verify local grocery stores applying to open shops on the FastNet Hyperlocal Marketplace. Approve to assign local wholesale suppliers.
                  </p>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Region</th>
                        <th>ID Type</th>
                        <th>ID Number</th>
                        <th>Shop Name</th>
                        <th>Shop Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingKyc.map(u => {
                        let kyc = u.kyc_details || {};
                        if (typeof kyc === 'string') {
                          try { kyc = JSON.parse(kyc); } catch (e) { kyc = {}; }
                        }
                        return (
                          <tr key={u.id}>
                            <td>{u.name}</td>
                            <td>{u.phone}</td>
                            <td>{u.region_id === 'r1' ? 'Kolkata South' : 'Rural Bishnupur'}</td>
                            <td>{kyc.id_type || u.kyc_id_type || '-'}</td>
                            <td>{kyc.id_number || u.kyc_id_number || '-'}</td>
                            <td>{kyc.shop_name || u.shop_name || `${u.name} Store`}</td>
                            <td>{kyc.shop_address || u.shop_address || u.address || '-'}</td>
                            <td>
                              <button className="btn btn-accent" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => {
                                triggerConfirmModal(
                                  'Approve Stockist KYC',
                                  `Approve ${u.name} as stockist? A vendor will be auto-assigned based on their region.`,
                                  () => handleApproveKyc(u.id)
                                );
                              }}>
                                Approve
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {pendingKyc.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No stockists awaiting KYC approval right now.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {(adminTab === 'config' || adminTab === 'rates') && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Commission & Points Config</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Configure profit-sharing reinvestment ratios, customer points percentages, and partner redemption cuts across global defaults and store overrides.
                  </p>

                  <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', borderColor: 'rgba(234, 179, 8, 0.4)', background: 'rgba(234, 179, 8, 0.08)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--warning)', margin: 0 }}>
                      Legacy per-order commission rates are no longer used for new orders. Historical orders retain their original math.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* LEFT COLUMN: GLOBAL DEFAULTS & LIVE WORKED EXAMPLE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '1rem', color: 'white', margin: 0 }}>Global Config Defaults</h4>
                        
                        <div className="input-group">
                          <label className="input-label">Stockist reinvestment % (of profit)</label>
                          <input 
                            type="number" 
                            className="text-input" 
                            value={globalReinvestPct} 
                            onChange={e => setGlobalReinvestPct(e.target.value)} 
                          />
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                            Portion of profit reinvested back to the stockist. The remainder is the platform pot.
                          </p>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Customer points % (of platform pot)</label>
                          <input 
                            type="number" 
                            className="text-input" 
                            value={globalPointsPct} 
                            onChange={e => setGlobalPointsPct(e.target.value)} 
                          />
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                            Portion of the platform pot credited to customer as points. The remainder is company commission.
                          </p>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Partner redemption cut % (of face value)</label>
                          <input 
                            type="number" 
                            className="text-input" 
                            value={globalCutPct} 
                            onChange={e => setGlobalCutPct(e.target.value)} 
                          />
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                            When a customer redeems a partner reward, the platform keeps this percentage. The partner receives the rest.
                          </p>
                        </div>

                        <button className="btn btn-accent" onClick={handleSaveGlobalConfig}>
                          Save Global Defaults
                        </button>
                      </div>

                      {/* LIVE WORKED EXAMPLE PANEL */}
                      {(() => {
                        const rPct = parseFloat(globalReinvestPct) || 0;
                        const pPct = parseFloat(globalPointsPct) || 0;
                        const cPct = parseFloat(globalCutPct) || 0;

                        const sampleProfit = 20;
                        const stockistReinvest = sampleProfit * (rPct / 100);
                        const stockistPayout = 80 + stockistReinvest;
                        const platformPot = sampleProfit - stockistReinvest;
                        const customerPoints = Math.round(platformPot * (pPct / 100) * 100) / 100;
                        const companyCommission = Math.round((platformPot - customerPoints) * 100) / 100;

                        const sampleRedemption = 250;
                        const platformCut = Math.round(sampleRedemption * (cPct / 100) * 100) / 100;
                        const partnerPayout = Math.round((sampleRedemption - platformCut) * 100) / 100;

                        return (
                          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.6)' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)', margin: 0 }}>Live Worked Example Calculation</h4>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              <p style={{ margin: '0 0 0.4rem 0', fontWeight: 'bold', color: 'white' }}>For ₹100 sale with ₹80 cost (₹20 profit margin):</p>
                              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                <li>Stockist keeps: <strong>₹{stockistPayout}</strong> (Cost ₹80 + ₹{stockistReinvest} reinvest)</li>
                                <li>Platform pot: <strong>₹{platformPot}</strong></li>
                                <li>Customer points: <strong>₹{customerPoints}</strong> ({pPct}% of pot)</li>
                                <li>Company commission: <strong>₹{companyCommission}</strong> ({100 - pPct}% of pot)</li>
                              </ul>
                              <p style={{ margin: '0.6rem 0 0.4rem 0', fontWeight: 'bold', color: 'white' }}>For ₹250 partner reward redemption:</p>
                              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                <li>Partner receives: <strong>₹{partnerPayout}</strong> ({100 - cPct}%)</li>
                                <li>Platform keeps: <strong>₹{platformCut}</strong> ({cPct}%)</li>
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* RIGHT COLUMN: PER-STORE OVERRIDES VIEW */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '1rem', color: 'white', margin: 0 }}>Per-Store Commission Overrides</h4>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setOverrideStockistId('');
                              setOverrideReinvestPct(globalReinvestPct);
                              setOverridePointsPct(globalPointsPct);
                              setOverrideCutPct(globalCutPct);
                              setShowStoreOverrideModal(true);
                            }}
                          >
                            + Add Store Override
                          </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Shop Name</th>
                                <th>Scope</th>
                                <th>Reinvest %</th>
                                <th>Points %</th>
                                <th>Partner Cut %</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(adminStockists.length > 0 ? adminStockists : customerStockists).map(s => {
                                const storeCfg = commissionConfigs.find(c => c.scope === 'STORE' && c.stockist_id === s.id);
                                const isOverride = !!storeCfg;
                                const reinvest = isOverride ? storeCfg.stockist_reinvest_pct : globalReinvestPct;
                                const points = isOverride ? storeCfg.points_from_pot_pct : globalPointsPct;
                                const cut = isOverride ? storeCfg.partner_redemption_cut_pct : globalCutPct;

                                return (
                                  <tr key={s.id}>
                                    <td>
                                      <strong>{s.name}</strong>
                                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.id}</div>
                                    </td>
                                    <td>
                                      {isOverride ? (
                                        <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Override</span>
                                      ) : (
                                        <span className="badge badge-secondary" style={{ fontSize: '0.6rem' }}>Global</span>
                                      )}
                                    </td>
                                    <td>{reinvest}%</td>
                                    <td>{points}%</td>
                                    <td>{cut}%</td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }}
                                          onClick={() => {
                                            setOverrideStockistId(s.id);
                                            setOverrideReinvestPct(reinvest);
                                            setOverridePointsPct(points);
                                            setOverrideCutPct(cut);
                                            setShowStoreOverrideModal(true);
                                          }}
                                        >
                                          {isOverride ? 'Edit' : 'Override'}
                                        </button>
                                        {isOverride && (
                                          <button 
                                            className="btn btn-danger" 
                                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }}
                                            onClick={() => {
                                              setOverrideToDelete(storeCfg);
                                              setShowRemoveOverrideConfirmModal(true);
                                            }}
                                          >
                                            Remove
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'feedback' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Feedback & Incident Queue</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    View service ratings, wrong items, no-shows, or customer behavioral reports filed by user roles.
                  </p>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Direction</th>
                        <th>Reporter</th>
                        <th>Target (Recipient)</th>
                        <th>Order ID</th>
                        <th>Rating</th>
                        <th>Reason / Incident Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allFeedbackReports.map(fb => (
                        <tr key={fb.id}>
                          <td>{new Date(fb.created_at).toLocaleDateString()}</td>
                          <td>
                            {fb.reporter_role === 'CUSTOMER' ? (
                              <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.15rem 0.35rem' }}>Customer <ArrowRight size={9} style={{ display: 'inline' }} /> Shop</span>
                            ) : (
                              <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '0.15rem 0.35rem', background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>Shop <ArrowRight size={9} style={{ display: 'inline' }} /> Customer</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{fb.reporter_name}</td>
                          <td>{fb.target_name} ({fb.target_role === 'STOCKIST' ? 'Shop' : 'Customer'})</td>
                          <td style={{ fontFamily: 'monospace' }}>#{fb.order_id.substring(2).toUpperCase()}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>
                                {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                              </span>
                              {fb.report_flag && (
                                <span className="badge badge-danger" style={{ fontSize: '0.55rem', padding: '0.1rem 0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.15rem', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>
                                  <AlertTriangle size={10} /> VIOLATION
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{fb.reason}</td>
                        </tr>
                      ))}
                      {allFeedbackReports.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No feedback reports submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'anomalies' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Suspicious Activity Flags</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Platform security engine automatically flags repeat order loops between unique customer-stockist pairs (helps prevent point farming collusion).
                  </p>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Customer Name</th>
                        <th>Stockist Store</th>
                        <th>Frequency Metric</th>
                        <th>Flagged Reason</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anomalies.map(an => (
                        <tr key={an.id}>
                          <td>{new Date(an.created_at).toLocaleTimeString()}</td>
                          <td>{an.customer_name}</td>
                          <td>{an.stockist_name}</td>
                          <td><span className="badge badge-danger">{an.frequency_metric}</span></td>
                          <td style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>{an.reason}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              {an.status === 'FLAGGED' ? (
                                <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <AlertTriangle size={12} /> Flagged for Investigation
                                </span>
                              ) : an.status === 'INVESTIGATED' ? (
                                <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <CheckCheck size={10} /> Investigated
                                </span>
                              ) : an.status === 'DISMISSED' ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Dismissed</span>
                              ) : (
                                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={() => handleFlagAnomaly(an.id)}>
                                  Flag for Review
                                </button>
                              )}
                              {an.status !== 'DISMISSED' && an.status !== 'INVESTIGATED' && (
                                <>
                                  <button className="btn btn-accent" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }} onClick={() => handleInvestigateAnomaly(an.id)}>
                                    <CheckCheck size={10} /> Mark Investigated
                                  </button>
                                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                                    <input
                                      type="text"
                                      className="text-input"
                                      style={{ fontSize: '0.6rem', padding: '0.2rem 0.3rem', flex: 1 }}
                                      placeholder="Dismiss reason..."
                                      value={dismissReason[an.id] || ''}
                                      onChange={e => setDismissReason(prev => ({ ...prev, [an.id]: e.target.value }))}
                                    />
                                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.6rem' }} onClick={() => handleDismissAnomaly(an.id)} title="Dismiss Flag">
                                      <ShieldOff size={10} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {anomalies.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No suspicious transaction patterns detected.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'redemptions' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem' }}>Subscriber Bill Discounts</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Approve and synchronize redeemed bill discounts with FastNet billing system.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }} onClick={exportRedemptionsCsv}>
                        <Download size={14} /> Export CSV
                      </button>
                    </div>
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Discount Reference ID</th>
                        <th>Date</th>
                        <th>Subscriber Name</th>
                        <th>Subscriber Phone</th>
                        <th>Subscriber Discount</th>
                        <th>Redemption Type</th>
                        <th>Sync Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRedemptions.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.id}</td>
                          <td>{new Date(r.created_at).toLocaleDateString()}</td>
                          <td>{r.customer_name}</td>
                          <td>{r.customer_phone}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{formatPoints(Math.abs(r.amount))}</td>
                          <td>{r.description || 'N/A'}</td>
                          <td>
                            <span className={`badge ${r.billing_sync_status === 'SYNCED' ? 'badge-success' : 'badge-warning'}`}>
                              {r.billing_sync_status || 'PENDING'}
                            </span>
                          </td>
                          <td>
                            {r.billing_sync_status !== 'SYNCED' ? (
                              <button className="btn btn-accent" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleCompleteRedemption(r.id)}>
                                Approve & Sync Bill Discount
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Synced to Billing</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {pendingRedemptions.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No subscriber redemptions logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'regions' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Region Management</h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                        Manage platform coverage areas, codes, and entity assignment counts.
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingRegion(null);
                        setRegionName('');
                        setRegionCode('');
                        setRegionCodeUserEdited(false);
                        setRegionModalError('');
                        setShowRegionModal(true);
                      }}
                    >
                      + Add Region
                    </button>
                  </div>

                  <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Code</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Users</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Stockists</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Partners</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Products</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Created</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminRegionsList.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No regions configured yet. Click "+ Add Region" to create one.
                            </td>
                          </tr>
                        ) : (
                          adminRegionsList.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{r.name}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}><code>{r.code}</code></td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{r.counts?.users || 0}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{r.counts?.stockists || 0}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{r.counts?.partners || 0}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{r.counts?.products || 0}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                    onClick={() => {
                                      setEditingRegion(r);
                                      setRegionName(r.name);
                                      setRegionCode(r.code);
                                      setRegionCodeUserEdited(true);
                                      setRegionModalError('');
                                      setShowRegionModal(true);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                    onClick={() => handleDeleteAdminRegion(r)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === 'vendors' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Approved Wholesalers List</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Configure wholesalers and approve them for local shopkeepers to buy stock from.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4>Register Wholesaler</h4>
                        <div className="input-group">
                          <label className="input-label">Wholesaler Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Garia Staples Wholesale Hub" 
                            className="text-input" 
                            value={adminNewVendor}
                            onChange={e => setAdminNewVendor(e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Region Area</label>
                          <select className="text-input" value={selectedRegionId} onChange={e => setSelectedRegionId(e.target.value)}>
                            <option value="">-- Select Region --</option>
                            {regions.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          {regions.length === 0 && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              No regions exist. Create one under Advanced → Regions first.
                            </p>
                          )}
                        </div>
                        <button className="btn" onClick={handleCreateVendor} disabled={regions.length === 0}>Register Wholesaler</button>
                      </div>

                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4>Approve Wholesaler for Store</h4>
                        <div className="input-group">
                          <label className="input-label">Select Shop</label>
                          <select className="text-input" value={vendorAdminStockistId} onChange={e => setVendorAdminStockistId(e.target.value)}>
                            <option value="">-- Select Shop --</option>
                            {customerStockists.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Select Wholesaler</label>
                          <select className="text-input" value={vendorAdminVendorId} onChange={e => setVendorAdminVendorId(e.target.value)}>
                            <option value="">-- Select Wholesaler --</option>
                            {vendors.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>
                        <button className="btn" onClick={() => handleAssignVendorToStockist(vendorAdminStockistId, vendorAdminVendorId)} disabled={!vendorAdminStockistId || !vendorAdminVendorId}>
                          Approve Association
                        </button>
                      </div>
                    </div>

                    <div>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Wholesaler ID</th>
                            <th>Name</th>
                            <th>Region Area</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendors.map(v => (
                            <tr key={v.id}>
                              <td style={{ fontFamily: 'monospace' }}>{v.id}</td>
                              <td>{v.name}</td>
                              <td>{v.region_id === 'r1' ? 'Kolkata South' : 'Rural West Bengal'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'transactions' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>All Marketplace Transactions</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Full visibility into orders, split commissions, and points generated across Garia & Bishnupur regions.
                  </p>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Store</th>
                        <th>Order Status</th>
                        <th>Fulfillment - Payment</th>
                        <th>Total Amount</th>
                        <th>Subtotal</th>
                        <th>Delivery Fee</th>
                        <th>Shop Share</th>
                        <th>Company Share</th>
                        <th>Points</th>
                        <th>Payment / Release</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbState?.orders?.map(o => {
                        const isRefundDue = o.payment_status === 'REFUND_DUE';
                        const platformCommission = o.platform_amount || 0;
                        const netRefundAmount = o.total_price - platformCommission;

                        return (
                          <tr key={o.id} style={isRefundDue ? { background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid var(--danger)' } : {}}>
                            <td style={{ fontFamily: 'monospace' }}>#{o.id.substring(2).toUpperCase()}</td>
                            <td>{o.stockist_name}</td>
                            <td><span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{formatOrderStatusDisplay(o.status, o.fulfillment_type)}</span></td>
                            <td style={{ fontSize: '0.75rem' }}>{o.fulfillment_type || 'N/A'} - {o.payment_method || 'N/A'}</td>
                            <td style={{ fontWeight: 'bold' }}>₹{o.total_price.toFixed(2)}</td>
                            <td>₹{o.subtotal.toFixed(2)}</td>
                            <td>₹{o.delivery_fee.toFixed(2)}</td>
                            <td style={{ color: 'var(--accent)' }}>₹{(o.stockist_amount || 0).toFixed(2)}</td>
                            <td style={{ color: 'var(--primary)' }}>₹{(o.platform_amount || 0).toFixed(2)}</td>
                            <td>{formatPoints(o.points_credited || 0)}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                                <span className={`badge ${o.payment_status === 'RELEASED' ? 'badge-success' : o.payment_status === 'COD' ? 'badge-warning' : o.payment_status === 'REFUNDED' ? 'badge-secondary' : o.payment_status === 'REFUND_DUE' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                                  {o.payment_status === 'HELD' ? <><Lock size={9} /> HELD</> : 
                                   o.payment_status === 'RELEASED' ? <><Check size={9} /> RELEASED</> : 
                                   o.payment_status === 'COD' ? <><Banknote size={9} /> COD</> : 
                                   o.payment_status === 'REFUND_DUE' ? 'REFUND DUE' :
                                   o.payment_status || 'N/A'}
                                </span>
                                {isRefundDue && (
                                  <button 
                                    className="btn btn-danger" 
                                    style={{ padding: '0.15rem 0.35rem', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.15rem', marginTop: '0.25rem' }} 
                                    onClick={() => handleAdminRefund(o.id)}
                                  >
                                    Refund Customer (₹{netRefundAmount.toFixed(2)})
                                  </button>
                                )}
                                {o.payment_status === 'HELD' && o.status === 'DELIVERED' && !o.split_released && (
                                  <button className="btn btn-accent" style={{ padding: '0.15rem 0.35rem', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }} onClick={() => handleReleaseSplit(o.id)}>
                                    <Banknote size={10} /> Release Split
                                  </button>
                                )}
                                {o.payment_status === 'COD' && o.status === 'DELIVERED' && (
                                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>COD — commission via ledger</span>
                                )}
                                {o.split_released && (
                                  <span style={{ fontSize: '0.6rem', color: 'var(--accent)' }}><Check size={9} style={{ display: 'inline' }} /> Released</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {(!dbState?.orders || dbState.orders.length === 0) && (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No transactions recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'leads' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Partner Leads</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Leads from cable and internet operators interested in partnering with FastNet Hyperlocal.
                  </p>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Operator/Company Name</th>
                        <th>Phone</th>
                        <th>Date Submitted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerLeads.map(l => (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 'bold' }}>{l.name}</td>
                          <td>{l.phone}</td>
                          <td>{new Date(l.created_at).toLocaleString()}</td>
                          <td>
                            <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {partnerLeads.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No partner leads submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // 5. SYSTEM INSPECTOR (Live SQLite schema view)
  // ----------------------------------------------------
  const renderDbInspector = () => {
    const tableData = dbState ? dbState[dbTab] : [];
    
    return (
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1>Real-time System Database Inspector</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Visualizes row modifications written directly to the SQLite backend</p>
        </div>

        <div className="inspector-tabs" style={{ background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button className={`role-tab ${dbTab === 'points_ledger' ? 'active' : ''}`} onClick={() => setDbTab('points_ledger')} style={{ borderRadius: '4px' }}>points_ledger (Ledger Row)</button>
          <button className={`role-tab ${dbTab === 'orders' ? 'active' : ''}`} onClick={() => setDbTab('orders')} style={{ borderRadius: '4px' }}>orders</button>
          <button className={`role-tab ${dbTab === 'products' ? 'active' : ''}`} onClick={() => setDbTab('products')} style={{ borderRadius: '4px' }}>products</button>
          <button className={`role-tab ${dbTab === 'commission_rates' ? 'active' : ''}`} onClick={() => setDbTab('commission_rates')} style={{ borderRadius: '4px' }}>commission_rates</button>
          <button className={`role-tab ${dbTab === 'vendors' ? 'active' : ''}`} onClick={() => setDbTab('vendors')} style={{ borderRadius: '4px' }}>vendors</button>
          <button className={`role-tab ${dbTab === 'anomaly_logs' ? 'active' : ''}`} onClick={() => setDbTab('anomaly_logs')} style={{ borderRadius: '4px' }}>anomaly_logs</button>
        </div>

        <div className="glass-card" style={{ background: '#080A0E', padding: '1.5rem', minHeight: '300px', overflowX: 'auto' }}>
          {tableData && tableData.length > 0 ? (
            <pre style={{ color: '#38BDF8', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              {JSON.stringify(tableData, null, 2)}
            </pre>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No rows recorded in "{dbTab}" table yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  if (needsSetup) {
    return (
      <div className="simulator-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem', background: '#0f172a' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)' }}>
          {setupSuccessAdmin ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                  {t('Administrator Account Created!', 'प्रशासक खाता बनाया गया!', 'অ্যাডমিনিস্ট্রেটর অ্যাকাউন্ট তৈরি করা হয়েছে!')}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {t(
                    `Administrator account created for phone ${setupSuccessAdmin.phone}. You can now log in with OTP 123456.`,
                    `फ़ोन ${setupSuccessAdmin.phone} के लिए प्रशासक खाता बनाया गया। अब आप ओटीपी 123456 के साथ लॉग इन कर सकते हैं।`,
                    `ফোন ${setupSuccessAdmin.phone} এর জন্য অ্যাডমিনিস্ট্রেটর অ্যাকাউন্ট তৈরি করা হয়েছে। আপনি এখন ওটিপি 123456 দিয়ে লগ ইন করতে পারেন।`
                  )}
                </p>
              </div>
              <button
                className="btn btn-accent"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold' }}
                onClick={() => {
                  setNeedsSetup(false);
                  setActiveRole('admin');
                  setLoginPhone(setupSuccessAdmin.phone);
                  setShowCustomerSignup(false);
                  setShowStockistSignup(false);
                }}
              >
                {t('Proceed to Admin Login', 'प्रशासक लॉगिन पर आगे बढ़ें', 'অ্যাডমিন লগইনে এগিয়ে যান')} →
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateAdminSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: 0, marginBottom: '0.35rem' }}>
                  Welcome to FastNet
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  No accounts exist yet. Create the administrator account to get started.
                </p>
              </div>

              {setupError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <span>{setupError}</span>
                </div>
              )}

              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  {t('Administrator Name', 'प्रशासक का नाम', 'অ্যাডমিনিস্ট্রেটরের নাম')}
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. System Administrator"
                  value={setupName}
                  onChange={e => setSetupName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  {t('Phone Number (10 digits)', 'फ़ोन नंबर (10 अंक)', 'ফোন নম্বর (১০ সংখ্যা)')}
                </label>
                <input
                  type="tel"
                  className="text-input"
                  placeholder="9876543210"
                  value={setupPhone}
                  onChange={e => setSetupPhone(e.target.value)}
                  maxLength={10}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                disabled={isSubmittingSetup}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.25rem' }}
              >
                {isSubmittingSetup ? t('Creating...', 'बनाया जा रहा है...', 'তৈরি করা হচ্ছে...') : t('Create Administrator Account', 'प्रशासक खाता बनाएं', 'অ্যাডমিনিस्ट্রেটর অ্যাকাউন্ট তৈরি করুন')}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.25rem' }}>
                {t("You'll log in with this phone number and an OTP.", "आप इस फ़ोन नंबर और ओटीपी से लॉग इन करेंगे।", "আপনি এই ফোন নম্বর এবং একটি ওটিপি দিয়ে লগ ইন করবেন।")}
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="simulator-shell">
      
      {/* Toast popup */}
      {toast && (
        <div className="toast-msg" style={{ borderLeft: `4px solid ${toast.type === 'error' ? 'var(--danger)' : 'var(--accent)'}`, position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, width: 'auto', background: '#131722', backdropFilter: 'blur(10px)' }}>
          <CheckCircle2 size={16} style={{ color: toast.type === 'error' ? 'var(--danger)' : 'var(--accent)' }} />
          <span>{toast.message}</span>
        </div>
      )}
      {/* Global Confirm Modal */}
      {confirmModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div 
            className="glass-card" 
            style={{
              width: '90%',
              maxWidth: '450px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: '#1a1f2c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.57)',
              color: 'var(--text-main)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', color: 'white', margin: 0 }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                onClick={() => setConfirmModal(null)}
              >
                {confirmModal.noLabel || t('No', 'नहीं', 'না')}
              </button>
              <button 
                className={confirmModal.danger ? 'btn btn-danger' : 'btn btn-accent'} 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                onClick={() => {
                  confirmModal.onConfirm?.();
                  setConfirmModal(null);
                }}
              >
                {confirmModal.yesLabel || t('Yes', 'हाँ', 'হ্যাঁ')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivered Celebratory Popup (Swiggy Pattern) */}
      {deliveredModalOrder && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setDeliveredModalOrder(null)}
        >
          <div 
            className="glass-card" 
            style={{
              width: '90%',
              maxWidth: '400px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1rem',
              background: '#1a1f2c',
              border: '1px solid var(--accent)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
              color: 'var(--text-main)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent)' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'white', margin: 0 }}>
              {t('Order Delivered!', 'ऑर्डर डिलीवर हो गया!', 'অর্ডার ডেলিভারড হয়েছে!')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Order #{deliveredModalOrder.id.substring(2).toUpperCase()}
            </p>
            <div className="points-glow-box" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', width: '100%', margin: '0.25rem 0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('Reward Points Earned', 'अर्जित रिवॉर्ड अंक', 'অর্জিত রিওয়ার্ড পয়েন্ট')}
              </span>
              <h2 style={{ fontSize: '1.8rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                <Sparkles size={20} style={{ color: 'var(--warning)' }} />
                +{formatPoints(deliveredModalOrder.points_credited || 0)}
              </h2>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('Rate your experience', 'अपना अनुभव रेट करें', 'আপনার অভিজ্ঞতা রেট করুন')}
              </span>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                    onClick={() => setDeliveredRating(star)}
                  >
                    <Star
                      size={24}
                      fill={star <= deliveredRating ? '#F59E0B' : 'transparent'}
                      style={{ color: star <= deliveredRating ? '#F59E0B' : 'var(--text-muted)' }}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="text-input"
                rows="2"
                placeholder={t('Optional comment...', 'वैकल्पिक टिप्पणी...', 'ঐচ্ছিক মন্তব্য...')}
                value={deliveredComment}
                onChange={(e) => setDeliveredComment(e.target.value)}
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.5rem', borderRadius: '8px', resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button 
                  className="btn btn-accent" 
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                  onClick={handleDeliveredSubmitReview}
                >
                  {t('Submit Review', 'समीक्षा भेजें', 'রিভিউ জমা দিন')}
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                  onClick={handleDeliveredSkipReview}
                >
                  {t('Skip', 'छोड़ें', 'এড়িয়ে যান')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Guided Walkthrough Tour Banner */}
      {renderTourBanner()}

      {/* Simulator Workspace Header */}
      <header className="simulator-header">
        <div className="brand" onClick={() => setActiveRole('marketing')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">F</div>
          <div>
            <span className="brand-name">FastNet Loyalty</span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pilot Platform Simulator</span>
          </div>
        </div>

        {/* Global Surface Switcher */}
        <div className="role-switcher">
          <button className={`role-tab ${activeRole === 'marketing' ? 'active' : ''}`} onClick={() => switchViewToRole('marketing')}>
            B2B Site
          </button>
          <button className={`role-tab ${activeRole === 'customer' ? 'active' : ''}`} onClick={() => switchViewToRole('customer')}>
            Customer App
          </button>
          <button className={`role-tab ${activeRole === 'stockist' ? 'active' : ''}`} onClick={() => switchViewToRole('stockist')}>
            Stockist App
          </button>
          <button className={`role-tab ${activeRole === 'admin' ? 'active' : ''}`} onClick={() => switchViewToRole('admin')}>
            Admin Portal
          </button>
          <button className={`role-tab ${activeRole === 'partner' ? 'active' : ''}`} onClick={() => switchViewToRole('partner')}>
            Partner App
          </button>
          {showDevSettings && (
            <button className={`role-tab ${activeRole === 'db' ? 'active' : ''}`} onClick={() => switchViewToRole('db')}>
              DB Inspector
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
          <span>API Connected</span>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="workspace-content">
        <main className="main-viewport">
          {activeRole === 'marketing' && renderMarketingView()}
          {activeRole === 'customer' && renderCustomerView()}
          {activeRole === 'stockist' && renderStockistView()}
          {activeRole === 'partner' && renderPartnerView()}
          {activeRole === 'admin' && renderAdminView()}
          {activeRole === 'db' && renderDbInspector()}
        </main>

        {/* Left Side API Request Log stream */}
        {showDevSettings && activeRole !== 'db' && (
          <aside className="inspector-panel">
            <div className="inspector-header">
              <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={14} style={{ color: 'var(--primary)' }} /> Live Gateway Request Logs
              </span>
              <button 
                onClick={() => setApiLogs([])} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer' }}
              >
                Clear Logs
              </button>
            </div>
            
            <div className="inspector-body">
              {apiLogs.map(log => (
                <div key={log.id} className="log-line" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>[{log.timestamp}]</span>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: log.status >= 200 && log.status < 300 ? 'var(--accent)' : 'var(--danger)' 
                    }}>
                      {log.method} {log.status}
                    </span>
                  </div>
                  <div style={{ color: '#E2E8F0', wordBreak: 'break-all' }}>{log.url}</div>
                  {log.payload && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '0.1rem' }}>
                      Payload: <span style={{ color: '#F472B6' }}>{log.payload}</span>
                    </div>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                    Resp: <span style={{ color: '#6EE7B7' }}>{log.response}</span>
                  </div>
                </div>
              ))}
              {apiLogs.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No requests logged yet. Interact with the simulators to view system logs.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* R3 Confirmation Modal */}
      {showRedeemConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <h3>Confirm Points Redemption</h3>
            <p style={{ margin: '1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Are you sure you want to redeem {redeemAmount} points for broadband bill discount?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowRedeemConfirmModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={executeRedeemPoints}>Yes, Redeem</button>
            </div>
          </div>
        </div>
      )}

      {/* R3 Success Modal */}
      {redeemSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto' }} />
            </div>
            <h3>Redemption successful!</h3>
            <p style={{ margin: '1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Your local cable/internet provider will contact you soon to activate your reward.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }} 
              onClick={() => {
                setRedeemSuccessModal(false);
                setCustomerAppTab('ledger');
              }}
            >
              View my points
            </button>
          </div>
        </div>
      )}

      {/* R4 Customer Fraud Report Modal */}
      {showFraudReportModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Report a Problem</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowFraudReportModal(false)}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="input-group">
                <label className="input-label">Subject</label>
                <select className="text-input" value={fraudSubject} onChange={e => setFraudSubject(e.target.value)}>
                  <option value="Stockist issue">Stockist issue</option>
                  <option value="Redemption issue">Redemption issue</option>
                  <option value="Points not credited">Points not credited</option>
                  <option value="Suspicious activity">Suspicious activity</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Description (min 20 chars)</label>
                <textarea 
                  className="text-input" 
                  rows={4}
                  placeholder="Provide details of the problem..." 
                  value={fraudDescription} 
                  onChange={e => setFraudDescription(e.target.value)} 
                />
                <small style={{ color: fraudDescription.trim().length >= 20 ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.65rem' }}>
                  {fraudDescription.trim().length}/20 chars min
                </small>
              </div>
              <div className="input-group">
                <label className="input-label">Linked Order or Ledger Entry (Optional)</label>
                <select className="text-input" value={fraudLinkedEntityId} onChange={e => {
                  const val = e.target.value;
                  setFraudLinkedEntityId(val);
                  if (val.startsWith('o-') || val.startsWith('ord-')) setFraudLinkedEntityType('order');
                  else if (val.startsWith('l-') || val.startsWith('pl-')) setFraudLinkedEntityType('ledger');
                  else setFraudLinkedEntityType('');
                }}>
                  <option value="">-- None --</option>
                  <optgroup label="Recent Orders">
                    {customerOrders.slice(0, 10).map(o => (
                      <option key={o.id} value={o.id}>Order #{o.id.substring(2).toUpperCase()} - ₹{o.total_price}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Points Ledger Entries">
                    {customerLedger.slice(0, 10).map(l => (
                      <option key={l.id} value={l.id}>{l.type} - {l.amount} pts ({new Date(l.created_at).toLocaleDateString()})</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowFraudReportModal(false)}>Cancel</button>
                <button className="btn btn-accent" onClick={handleSubmitFraudReport}>Submit Report</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* R5 Edit Customer Contact Modal */}
      {showEditCustomerModal && selectedCustomerDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <h3>Edit Customer Contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1rem 0' }}>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input type="text" className="text-input" value={editCustomerName} onChange={e => setEditCustomerName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="text-input" value={editCustomerEmail} onChange={e => setEditCustomerEmail(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowEditCustomerModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleSaveEditCustomer}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* R5 Change Customer Phone Modal */}
      {showChangePhoneModal && selectedCustomerDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <h3>Change Customer Phone</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Phone: {selectedCustomerDetail.phone}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1rem 0' }}>
              <div className="input-group">
                <label className="input-label">Current Phone OTP (Demo: 123456)</label>
                <input type="text" className="text-input" placeholder="123456" value={changePhoneCurrentOtp} onChange={e => setChangePhoneCurrentOtp(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">New Phone Number</label>
                <input type="text" className="text-input" placeholder="9830099999" value={changePhoneNewNumber} onChange={e => setChangePhoneNewNumber(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">New Phone OTP (Demo: 123456)</label>
                <input type="text" className="text-input" placeholder="123456" value={changePhoneNewOtp} onChange={e => setChangePhoneNewOtp(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowChangePhoneModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleChangeCustomerPhone}>Verify & Change Phone</button>
            </div>
          </div>
        </div>
      )}

      {/* BF5b Add/Edit Region Modal */}
      {showRegionModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{editingRegion ? 'Edit Region' : 'Add New Region'}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowRegionModal(false)}>
                <X size={14} />
              </button>
            </div>

            {regionModalError && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
                {regionModalError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 'bold' }}>Region Name</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. Kolkata South (Garia)"
                  value={regionName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegionName(val);
                    if (!editingRegion && !regionCodeUserEdited) {
                      setRegionCode(val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'));
                    }
                  }}
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 'bold' }}>Region Code (URL slug)</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. kolkata-south"
                  value={regionCode}
                  onChange={(e) => {
                    setRegionCode(e.target.value);
                    setRegionCodeUserEdited(true);
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Lowercase letters, numbers, and hyphens only.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowRegionModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveAdminRegion}>
                {editingRegion ? 'Update Region' : 'Create Region'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* R5 Manual Points Credit Modal */}
      {showPointsCreditModal && selectedCustomerDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <h3>Manual Points Credit</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer: {selectedCustomerDetail.name} ({selectedCustomerDetail.phone})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1rem 0' }}>
              <div className="input-group">
                <label className="input-label">Points Amount (positive integer)</label>
                <input type="number" className="text-input" placeholder="100" value={pointsCreditAmount} onChange={e => setPointsCreditAmount(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Reason (Required for audit log)</label>
                <input type="text" className="text-input" placeholder="Goodwill credit / Support compensation" value={pointsCreditReason} onChange={e => setPointsCreditReason(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowPointsCreditModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleIssuePointsCredit}>Credit Points</button>
            </div>
          </div>
        </div>
      )}

      {/* R5 Customer Detail Modal */}
      {selectedCustomerDetail && !showEditCustomerModal && !showChangePhoneModal && !showPointsCreditModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Customer Detail: {selectedCustomerDetail.name}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedCustomerDetail(null)}><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div><strong>Phone:</strong> {selectedCustomerDetail.phone}</div>
              <div><strong>Email:</strong> {selectedCustomerDetail.email || 'N/A'}</div>
              <div><strong>Region:</strong> {selectedCustomerDetail.region_id}</div>
              <div><strong>Status:</strong> {selectedCustomerDetail.is_active !== false ? 'Active' : 'Deactivated'}</div>
              <div><strong>Points Balance:</strong> {selectedCustomerDetail.points_balance || 0} pts</div>
              <div><strong>Joined:</strong> {new Date(selectedCustomerDetail.created_at).toLocaleDateString()}</div>
            </div>

            <h4 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>Order History ({selectedCustomerDetail.orders?.length || 0})</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem' }}>
              {selectedCustomerDetail.orders?.map(o => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.3rem 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                  <span>Order #{o.id.substring(2).toUpperCase()} ({o.stockist_name})</span>
                  <span>₹{o.total_price} - <strong style={{ color: 'var(--accent)' }}>{o.status}</strong></span>
                </div>
              ))}
              {(!selectedCustomerDetail.orders || selectedCustomerDetail.orders.length === 0) && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No orders placed.</p>}
            </div>

            <h4 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>Points Ledger ({selectedCustomerDetail.ledger?.length || 0})</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {selectedCustomerDetail.ledger?.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.3rem 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                  <span>{l.description} ({new Date(l.created_at).toLocaleDateString()})</span>
                  <span style={{ color: l.type === 'EARN' ? 'var(--accent)' : 'var(--danger)', fontWeight: 'bold' }}>{l.amount > 0 ? '+' : ''}{l.amount}</span>
                </div>
              ))}
              {(!selectedCustomerDetail.ledger || selectedCustomerDetail.ledger.length === 0) && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No points entries.</p>}
            </div>
          </div>
        </div>
      )}

      {/* R6 Create Stockist Modal */}
      {showCreateStockistModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Create New Stockist</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowCreateStockistModal(false)}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Stockist / Shop Name</label>
                <input type="text" className="text-input" placeholder="e.g. Garia Super Mart" value={createStkName} onChange={e => setCreateStkName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Phone Number (Login user)</label>
                <input type="text" className="text-input" placeholder="9830011223" value={createStkPhone} onChange={e => setCreateStkPhone(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group">
                  <label className="input-label">Region</label>
                  <select className="text-input" value={createStkRegion} onChange={e => setCreateStkRegion(e.target.value)}>
                    <option value="">-- Select Region --</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {regions.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      No regions exist. Create one under Advanced → Regions first.
                    </p>
                  )}
                </div>
                <div className="input-group">
                  <label className="input-label">Assigned Wholesaler</label>
                  <select className="text-input" value={createStkVendor} onChange={e => setCreateStkVendor(e.target.value)}>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group">
                  <label className="input-label">Commission Rate (%)</label>
                  <input type="number" className="text-input" value={createStkRate} onChange={e => setCreateStkRate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Delivery Radius (km)</label>
                  <input type="number" step="0.5" className="text-input" value={createStkRadius} onChange={e => setCreateStkRadius(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Open Time</label>
                  <input type="text" className="text-input" value={createStkOpen} onChange={e => setCreateStkOpen(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Close Time</label>
                  <input type="text" className="text-input" value={createStkClose} onChange={e => setCreateStkClose(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Prep ETA (m)</label>
                  <input type="number" className="text-input" value={createStkEta} onChange={e => setCreateStkEta(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowCreateStockistModal(false)}>Cancel</button>
                <button className="btn btn-accent" onClick={handleCreateStockist} disabled={regions.length === 0}>Create Stockist</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* R6 Edit Stockist Details Modal */}
      {showEditStockistModal && selectedStockistDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Edit Stockist Details</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowEditStockistModal(false)}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Stockist Name</label>
                <input type="text" className="text-input" value={editStkName} onChange={e => setEditStkName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Address</label>
                <input type="text" className="text-input" value={editStkAddress} onChange={e => setEditStkAddress(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Opening Time</label>
                  <input type="text" className="text-input" value={editStkOpen} onChange={e => setEditStkOpen(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Closing Time</label>
                  <input type="text" className="text-input" value={editStkClose} onChange={e => setEditStkClose(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Prep ETA (min)</label>
                  <input type="number" className="text-input" value={editStkEta} onChange={e => setEditStkEta(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Delivery Radius (km)</label>
                <input type="number" step="0.5" className="text-input" value={editStkRadius} onChange={e => setEditStkRadius(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowEditStockistModal(false)}>Cancel</button>
                <button className="btn btn-accent" onClick={handleEditStockist}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* R6 Commission Rate Change Modal with 30d Preview & CONFIRM Requirement */}
      {showCommissionRateModal && selectedStockistDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Change Commission Rate</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowCommissionRateModal(false)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stockist: <strong>{selectedStockistDetail.name}</strong> (Current: {selectedStockistDetail.commission_rate}%)</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1rem 0' }}>
              <div className="input-group">
                <label className="input-label">New Commission Rate (%)</label>
                <input type="number" step="0.1" className="text-input" value={newCommissionRate} onChange={e => setNewCommissionRate(e.target.value)} />
              </div>
              
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={handlePreviewCommissionRate}>
                Calculate 30-Day Earnings Preview
              </button>

              {commissionRatePreview && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>30-Day Total Orders: <strong>{commissionRatePreview.ordersCount}</strong></div>
                  <div>30-Day Gross GMV: <strong>₹{commissionRatePreview.grossGMV.toFixed(2)}</strong></div>
                  <div>Earnings at Old Rate ({commissionRatePreview.oldRate}%): <strong>₹{commissionRatePreview.oldEarnings.toFixed(2)}</strong></div>
                  <div>Earnings at New Rate ({commissionRatePreview.newRate}%): <strong style={{ color: 'var(--accent)' }}>₹{commissionRatePreview.newEarnings.toFixed(2)}</strong></div>
                  <div>Difference: <strong style={{ color: commissionRatePreview.diff >= 0 ? 'var(--accent)' : 'var(--danger)' }}>₹{commissionRatePreview.diff.toFixed(2)}</strong></div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label" style={{ color: 'var(--warning)' }}>Type "CONFIRM" to authorize this change</label>
                <input type="text" className="text-input" placeholder="CONFIRM" value={commissionTypedConfirm} onChange={e => setCommissionTypedConfirm(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowCommissionRateModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleSubmitCommissionRate} disabled={commissionTypedConfirm !== 'CONFIRM'}>
                Apply Rate Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* R6 Change Stockist Region Modal with Binding Count Warning */}
      {showStockistRegionModal && selectedStockistDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Change Stockist Region</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowStockistRegionModal(false)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stockist: <strong>{selectedStockistDetail.name}</strong></p>

            {stockistBindingsCount > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', borderRadius: '6px', padding: '0.65rem', margin: '0.75rem 0', fontSize: '0.75rem', color: 'var(--warning)' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
                <strong>Warning:</strong> Moving this stockist will affect <strong>{stockistBindingsCount}</strong> existing customer binding(s).
              </div>
            )}

            <div className="input-group" style={{ margin: '1rem 0' }}>
              <label className="input-label">Select Target Region</label>
              <select className="text-input" value={newStockistRegion} onChange={e => setNewStockistRegion(e.target.value)}>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowStockistRegionModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleChangeStockistRegion}>Confirm Region Move</button>
            </div>
          </div>
        </div>
      )}

      {/* R7 Partner Lead Detail & Notes Modal */}
      {selectedLeadDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Lead Details: {selectedLeadDetail.name}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedLeadDetail(null)}><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
              <div>Phone: <strong>{selectedLeadDetail.phone}</strong></div>
              <div>Status: <strong>{selectedLeadDetail.status}</strong></div>
              <div>Region: <strong>{selectedLeadDetail.region_id || 'r1'}</strong></div>
              <div>Created: <strong>{new Date(selectedLeadDetail.created_at).toLocaleDateString()}</strong></div>
            </div>

            <h4 style={{ fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>Internal Notes</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {selectedLeadDetail.notes?.map((n, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{n.admin_user_id || 'Admin'} at {new Date(n.timestamp).toLocaleString()}</div>
                  <div>{n.text}</div>
                </div>
              ))}
              {(!selectedLeadDetail.notes || selectedLeadDetail.notes.length === 0) && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No internal notes recorded.</p>}
            </div>

            <div className="input-group">
              <label className="input-label">Add Note</label>
              <input type="text" className="text-input" placeholder="Enter note text..." value={newLeadNoteText} onChange={e => setNewLeadNoteText(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLeadDetail(null)}>Close</button>
              <button className="btn btn-accent" onClick={handleAddLeadNote}>Add Note</button>
            </div>
          </div>
        </div>
      )}

      {/* R8 Fraud Report Admin Review Modal */}
      {selectedFraudReportDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Review Fraud Report</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedFraudReportDetail(null)}><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
              <div>Reporter ID: <strong>{selectedFraudReportDetail.reporter_customer_id}</strong></div>
              <div>Status: <strong>{selectedFraudReportDetail.status}</strong></div>
              <div>Subject: <strong>{selectedFraudReportDetail.subject}</strong></div>
              <div>Linked Entity: <strong>{selectedFraudReportDetail.linked_entity_type || 'None'}: {selectedFraudReportDetail.linked_entity_id || 'N/A'}</strong></div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <strong>Description:</strong>
              <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-main)' }}>{selectedFraudReportDetail.description}</p>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Admin Notes (min 10 chars required for Resolve/Dismiss)</label>
              <textarea 
                className="text-input" 
                rows={3}
                placeholder="Document investigation outcome..."
                value={fraudReportAdminNotes}
                onChange={e => setFraudReportAdminNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedFraudReportDetail(null)}>Close</button>
              {selectedFraudReportDetail.status === 'NEW' && (
                <button className="btn btn-primary" onClick={() => handleUpdateFraudReportStatus(selectedFraudReportDetail.id, 'TRIAGING', fraudReportAdminNotes)}>
                  Move to Triaging
                </button>
              )}
              <button className="btn btn-accent" onClick={() => handleUpdateFraudReportStatus(selectedFraudReportDetail.id, 'RESOLVED', fraudReportAdminNotes)}>
                Resolve
              </button>
              <button className="btn btn-danger" onClick={() => handleUpdateFraudReportStatus(selectedFraudReportDetail.id, 'DISMISSED', fraudReportAdminNotes)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round S Store Override Modal */}
      {showStoreOverrideModal && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ width: '420px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>Configure Store Override</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowStoreOverrideModal(false)}><X size={14} /></button>
            </div>

            <div className="input-group">
              <label className="input-label">Select Stockist Shop</label>
              <select className="text-input" value={overrideStockistId} onChange={e => setOverrideStockistId(e.target.value)}>
                <option value="">-- Select Shop --</option>
                {(adminStockists.length > 0 ? adminStockists : customerStockists).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Stockist reinvestment % (of profit)</label>
              <input type="number" className="text-input" value={overrideReinvestPct} onChange={e => setOverrideReinvestPct(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">Customer points % (of platform pot)</label>
              <input type="number" className="text-input" value={overridePointsPct} onChange={e => setOverridePointsPct(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">Partner redemption cut % (of face value)</label>
              <input type="number" className="text-input" value={overrideCutPct} onChange={e => setOverrideCutPct(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowStoreOverrideModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleSaveStoreOverride}>Save Override</button>
            </div>
          </div>
        </div>
      )}

      {/* Round S Remove Override Confirmation Modal */}
      {showRemoveOverrideConfirmModal && overrideToDelete && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ width: '380px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>Remove Store Override</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              This stockist will revert to global rates: 50/40/12.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setShowRemoveOverrideConfirmModal(false); setOverrideToDelete(null); }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleRemoveStoreOverride(overrideToDelete.id)}>
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* P2 Promote Lead to Partner Modal */}
      {showPromoteLeadModal && selectedLeadToPromote && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Promote Lead to Partner</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowPromoteLeadModal(false)}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="input-group">
                <label className="input-label">Lead Name / Business</label>
                <input type="text" className="text-input" value={selectedLeadToPromote.name || ''} readOnly style={{ opacity: 0.7 }} />
              </div>
              <div className="input-group">
                <label className="input-label">Partner Display Name</label>
                <input type="text" className="text-input" value={promoteDisplayName} onChange={e => setPromoteDisplayName(e.target.value)} placeholder="e.g. Bishnupur Cable Network" />
              </div>
              <div className="input-group">
                <label className="input-label">Service Types Offered</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {['CABLE', 'BROADBAND', 'DTH', 'OTT_BUNDLE'].map(st => (
                    <label key={st} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={promoteServiceTypes.includes(st)}
                        onChange={e => {
                          if (e.target.checked) setPromoteServiceTypes([...promoteServiceTypes, st]);
                          else setPromoteServiceTypes(promoteServiceTypes.filter(s => s !== st));
                        }}
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowPromoteLeadModal(false)}>Cancel</button>
                <button className="btn btn-accent" onClick={handlePromoteLeadSubmit}>Promote to Partner</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* P2 Approve Redemption Modal */}
      {showApproveRedemptionModal && selectedRedemptionToApprove && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Approve Redemption Request</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowApproveRedemptionModal(false)}><X size={14} /></button>
            </div>
            <div style={{ fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div><strong>Customer:</strong> {selectedRedemptionToApprove.customer_name} ({selectedRedemptionToApprove.customer_phone})</div>
              <div><strong>Partner:</strong> {selectedRedemptionToApprove.partner_name}</div>
              <div><strong>Package:</strong> {selectedRedemptionToApprove.package_name}</div>
              <div><strong>Face Value:</strong> ₹{selectedRedemptionToApprove.face_value_rupees} ({selectedRedemptionToApprove.points_deducted} points)</div>
            </div>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Admin Notes (Optional)</label>
              <textarea className="text-input" rows={3} placeholder="Verification notes or authorization code..." value={approveNotes} onChange={e => setApproveNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowApproveRedemptionModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={() => handleApproveRedemption(selectedRedemptionToApprove.id, approveNotes)}>Approve Request</button>
            </div>
          </div>
        </div>
      )}

      {/* P2 Reject Redemption Modal */}
      {showRejectRedemptionModal && selectedRedemptionToReject && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--danger)' }}>Reject Redemption Request</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowRejectRedemptionModal(false)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Rejecting will credit back <strong>{selectedRedemptionToReject.points_deducted} points</strong> to customer {selectedRedemptionToReject.customer_name}'s ledger as REDEEM_REFUND.
            </p>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Rejection Reason (Mandatory, min 10 chars)</label>
              <textarea className="text-input" rows={3} placeholder="State reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowRejectRedemptionModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleRejectRedemption(selectedRedemptionToReject.id, rejectReason)}>Confirm Rejection & Refund Points</button>
            </div>
          </div>
        </div>
      )}

      {/* P2 Resolve Dispute Modal */}
      {showResolveDisputeModal && selectedRedemptionToResolve && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Resolve Partner Dispute</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowResolveDisputeModal(false)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Dispute reason from partner: <em>"{selectedRedemptionToResolve.disputed_reason}"</em>
            </p>
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Resolution Outcome</label>
              <select className="text-input" value={resolveOutcome} onChange={e => setResolveOutcome(e.target.value)}>
                <option value="fulfill">Override & Mark FULFILLED</option>
                <option value="reject">Accept Dispute & REJECT (Refund Points)</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Resolution Notes</label>
              <textarea className="text-input" rows={3} placeholder="Notes explaining resolution..." value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowResolveDisputeModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={() => handleResolveDispute(selectedRedemptionToResolve.id, resolveOutcome, resolveNotes)}>Submit Resolution</button>
            </div>
          </div>
        </div>
      )}

      {/* P2 Onboarded Partner Detail Modal */}
      {selectedPartnerDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Partner Details: {selectedPartnerDetail.display_name}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedPartnerDetail(null)}><X size={14} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
              <div className="glass-card" style={{ padding: '0.75rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Basics</h4>
                <div>Legal Name: <strong>{selectedPartnerDetail.legal_name}</strong></div>
                <div>Phone: <strong>{selectedPartnerDetail.contact_phone}</strong> | Email: <strong>{selectedPartnerDetail.contact_email || 'N/A'}</strong></div>
                <div>Services: <strong>{(selectedPartnerDetail.service_types || []).join(', ')}</strong></div>
                <div>Address: {selectedPartnerDetail.address || 'N/A'} | GST: {selectedPartnerDetail.gst_number || 'N/A'}</div>
              </div>

              <div className="glass-card" style={{ padding: '0.75rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Service Regions ({(selectedPartnerDetail.regions || []).length})</h4>
                {(selectedPartnerDetail.regions || []).map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span>{r.region_id === 'r1' ? 'Kolkata South' : r.region_id === 'r2' ? 'Rural Bishnupur' : r.region_id}</span>
                    <span className={`badge ${r.is_active ? 'badge-success' : 'badge-secondary'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                ))}
              </div>

              <div className="glass-card" style={{ padding: '0.75rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Packages ({(selectedPartnerDetail.packages || []).length})</h4>
                {(selectedPartnerDetail.packages || []).map(pkg => (
                  <div key={pkg.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                    <div>
                      <strong>{pkg.package_name}</strong> ({pkg.service_type}) <br/>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Face: ₹{pkg.face_value_rupees} | Cost: {pkg.point_cost} pts</span>
                    </div>
                    <span className={`badge ${pkg.is_active ? 'badge-success' : 'badge-secondary'}`}>{pkg.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* P2 Redemption Approval Detail Modal */}
      {selectedRedemptionDetail && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Redemption Approval Details</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedRedemptionDetail(null)}><X size={14} /></button>
            </div>

            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div><strong>Approval ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedRedemptionDetail.id}</span></div>
              <div><strong>Status:</strong> <span className="badge badge-primary">{selectedRedemptionDetail.status}</span></div>
              <div><strong>Customer:</strong> {selectedRedemptionDetail.customer_name} ({selectedRedemptionDetail.customer_phone})</div>
              <div><strong>Partner:</strong> {selectedRedemptionDetail.partner_name}</div>
              <div><strong>Package:</strong> {selectedRedemptionDetail.package_name}</div>
              <div><strong>Face Value:</strong> ₹{selectedRedemptionDetail.face_value_rupees}</div>
              <div><strong>Points Deducted:</strong> {selectedRedemptionDetail.points_deducted}</div>
              <div><strong>Ledger ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedRedemptionDetail.ledger_id}</span></div>
              {selectedRedemptionDetail.refund_ledger_id && <div><strong>Refund Ledger ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedRedemptionDetail.refund_ledger_id}</span></div>}
              {selectedRedemptionDetail.approved_at && <div><strong>Approved At:</strong> {new Date(selectedRedemptionDetail.approved_at).toLocaleString()}</div>}
              {selectedRedemptionDetail.fulfilled_at && <div><strong>Fulfilled At:</strong> {new Date(selectedRedemptionDetail.fulfilled_at).toLocaleString()}</div>}
              {selectedRedemptionDetail.rejected_at && <div><strong>Rejected At:</strong> {new Date(selectedRedemptionDetail.rejected_at).toLocaleString()}</div>}
              {selectedRedemptionDetail.admin_notes && <div><strong>Admin Notes:</strong> {selectedRedemptionDetail.admin_notes}</div>}
              {selectedRedemptionDetail.partner_notes && <div><strong>Partner Notes:</strong> {selectedRedemptionDetail.partner_notes}</div>}
              {selectedRedemptionDetail.rejected_reason && <div><strong>Rejected Reason:</strong> {selectedRedemptionDetail.rejected_reason}</div>}
              {selectedRedemptionDetail.disputed_reason && <div><strong>Disputed Reason:</strong> {selectedRedemptionDetail.disputed_reason}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Developer Settings Toggle Switcher Footer */}
      <footer className="dev-toggle-container">
        <label className="dev-toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
          <input 
            type="checkbox" 
            checked={showDevSettings} 
            onChange={e => setShowDevSettings(e.target.checked)} 
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>
            Show Developer Options (Live Gateway Log Stream & DB Row Inspector)
          </span>
        </label>
      </footer>

      {/* Bill History Modal */}
      {showBillHistoryModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '550px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Bill Photo History: {billHistoryProduct?.name}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowBillHistoryModal(false)}><X size={14} /></button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Selling Price</th>
                  <th>Cost Price</th>
                  <th>Status</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {billHistoryData.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontSize: '0.75rem' }}>{formatBillDate(b.uploaded_at || b.created_at)}</td>
                    <td>{formatBillPrice(b.selling_price_at_upload ?? b.declared_price)}</td>
                    <td>{formatBillPrice(b.cost_price_at_upload ?? b.declared_cost_price)}</td>
                    <td>
                      <span className={`badge ${b.flag_status === 'FLAGGED' ? 'badge-danger' : b.flag_status === 'RESOLVED' ? 'badge-primary' : 'badge-success'}`}>
                        {b.flag_status}
                      </span>
                    </td>
                    <td>
                      {(b.r2_key || b.public_url) && (
                        <img 
                          src={b.r2_key ? `${API_BASE}/bills/${b.r2_key}` : b.public_url} 
                          alt="Bill" 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => setViewingBillModal(b)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {billHistoryData.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No bill history found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flag Bill Modal */}
      {showFlagBillModal && flaggingBill && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <h3>Flag Bill Photo</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product: {flaggingBill.product_name || flaggingBill.product_id}</p>
            <div className="input-group" style={{ margin: '1rem 0' }}>
              <label className="input-label">Reason for Flagging (min 10 characters) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea 
                className="text-input" 
                style={{ height: '80px', fontSize: '0.8rem' }}
                placeholder="e.g., Unclear receipt, price mismatch, non-wholesale invoice format..."
                value={flagReasonText} 
                onChange={e => setFlagReasonText(e.target.value)} 
              />
              <small style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{flagReasonText.length}/10 chars min</small>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowFlagBillModal(false)}>Cancel</button>
              <button className="btn btn-warning" onClick={handleFlagBillPhoto}>Flag Bill Photo</button>
            </div>
          </div>
        </div>
      )}

      {/* Unflag / Resolve Bill Modal */}
      {showUnflagBillModal && unflaggingBill && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <h3>Mark Bill Photo Resolved</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirm that this bill photo issue has been investigated and resolved.</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowUnflagBillModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleUnflagBillPhoto}>Confirm Resolved</button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Bill Image Modal */}
      {viewingBillModal && (
        <div className="modal-overlay" onClick={() => setViewingBillModal(null)}>
          <div className="modal-content glass-card" style={{ maxWidth: '600px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Bill Photo Inspection</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setViewingBillModal(null)}><X size={14} /></button>
            </div>
            {(viewingBillModal.r2_key || viewingBillModal.public_url) ? (
              <img src={viewingBillModal.r2_key ? `${API_BASE}/bills/${viewingBillModal.r2_key}` : viewingBillModal.public_url} alt="Full Bill Photo" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No public preview URL available.</p>
            )}
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left' }}>
              <p>Uploaded: {formatBillDate(viewingBillModal.uploaded_at || viewingBillModal.created_at)}</p>
              <p>Selling Price: {formatBillPrice(viewingBillModal.selling_price_at_upload ?? viewingBillModal.declared_price)} | Cost: {formatBillPrice(viewingBillModal.cost_price_at_upload ?? viewingBillModal.declared_cost_price)}</p>
              {viewingBillModal.flag_reason && <p style={{ color: 'var(--danger)' }}>Flag Reason: {viewingBillModal.flag_reason}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Customer Price Provenance Modal */}
      {customerProvenanceProduct && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Price Provenance & Integrity</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setCustomerProvenanceProduct(null)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{customerProvenanceProduct.name}</p>
            <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '6px', margin: '0.75rem 0', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.25rem 0' }}>
                <span>Listed Selling Price:</span>
                <strong>₹{customerProvenanceProduct.price}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.25rem 0' }}>
                <span>Verified Wholesale Cost:</span>
                <span>₹{customerProvenanceProduct.cost_price}</span>
              </div>
            </div>

            {customerProvenanceProduct.has_flagged_bill && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', color: '#fca5a5', marginBottom: '0.75rem' }}>
                ⚠️ Notice: One or more bill photos for this SKU are currently flagged for operator review.
              </div>
            )}

            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Wholesale Bill Upload History</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {customerProvenanceHistory.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '0.3rem 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                  <span>{formatBillDate(b.uploaded_at || b.created_at)}</span>
                  <span>Cost: {formatBillPrice(b.cost_price_at_upload ?? b.declared_cost_price)} → Price: {formatBillPrice(b.selling_price_at_upload ?? b.declared_price)}</span>
                  <span className={`badge ${b.flag_status === 'FLAGGED' ? 'badge-danger' : 'badge-success'}`}>{b.flag_status}</span>
                </div>
              ))}
              {customerProvenanceHistory.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No bill history records found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
