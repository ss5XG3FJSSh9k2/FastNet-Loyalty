import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
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
  Star
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
  const [activeRole, setActiveRole] = useState('marketing');
  const [dbState, setDbState] = useState(null);
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('r1');
  const [currentUser, setCurrentUser] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState(null);
  const [confirmDeliverySwitchOrderId, setConfirmDeliverySwitchOrderId] = useState(null);

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

  // New expansion states
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

  const getAvailableSlots = (stockist) => {
    if (!stockist) return [];
    const opening = stockist.opening_time || '08:00';
    const closing = stockist.closing_time || '20:00';
    const prepMinutes = stockist.prep_eta_minutes || 10;

    const slots = [];
    const [opH, opM] = opening.split(':').map(Number);
    const [clH, clM] = closing.split(':').map(Number);

    const now = new Date();
    const minTime = new Date(now.getTime() + prepMinutes * 60 * 1000);
    const minH = minTime.getHours();
    const minM = minTime.getMinutes();

    for (let h = opH; h < clH; h++) {
      const slotStartStr = String(h).padStart(2, '0') + ':00';
      const slotEndStr = String(h + 1).padStart(2, '0') + ':00';
      const slotVal = slotStartStr + '–' + slotEndStr;

      if (h > minH || (h === minH && 0 >= minM)) {
        slots.push(slotVal);
      }
    }

    if (slots.length === 0) {
      for (let h = opH; h < Math.min(opH + 4, clH); h++) {
        const slotStartStr = String(h).padStart(2, '0') + ':00';
        const slotEndStr = String(h + 1).padStart(2, '0') + ':00';
        slots.push(slotStartStr + '–' + slotEndStr);
      }
    }
    return slots;
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
  const [adminTab, setAdminTab] = useState('kyc'); // kyc, rates, anomalies, redemptions, vendors, leads
  const [pendingKyc, setPendingKyc] = useState([]);
  const [commissionRates, setCommissionRates] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [pendingRedemptions, setPendingRedemptions] = useState([]);
  const [adminNewVendor, setAdminNewVendor] = useState('');
  const [partnerLeads, setPartnerLeads] = useState([]);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  
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
  const [regRegion, setRegRegion] = useState('r1');
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
    if (status === 'PENDING') {
      return t('Pending', 'लंबित', 'অপেক্ষারত');
    }
    if (status === 'ACCEPTED') {
      return t('Accepted', 'स्वीकृत', 'স্বীকৃত');
    }
    if (status === 'PREPARING') {
      return t('Preparing', 'तैयार किया जा रहा है', 'প্রস্তুত করা হচ্ছে');
    }
    if (status === 'READY_FOR_PICKUP') {
      return t('Ready for Pickup', 'पिकअप के लिए तैयार', 'পিকআপের জন্য প্রস্তুত');
    }
    if (status === 'OUT_FOR_DELIVERY') {
      return t('Out for Delivery', 'वितरण के लिए बाहर', 'ডেলিভারির জন্য পাঠানো হয়েছে');
    }
    if (status === 'DELIVERED') {
      return isPickup ? t('Picked Up', 'পিকআপ করা হয়েছে', 'পিকআপ সম্পন্ন') : t('Delivered', 'वितरित', 'ডেলিভারি সম্পন্ন');
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
            const pendingOrder = oData.find(o => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY');
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
            onClick={() => {
              if (step.role === 'customer' && (!currentUser || currentUser.role !== 'CUSTOMER')) {
                // Trigger auto login
                handleAutoTourStep();
              } else if (step.role === 'stockist' && (!currentUser || currentUser.role !== 'STOCKIST')) {
                // Trigger auto login
                handleAutoTourStep();
              } else if (step.role === 'admin' && (!currentUser || currentUser.role !== 'ADMIN')) {
                // Trigger auto login
                handleAutoTourStep();
              } else {
                setActiveRole(step.role);
              }
            }}
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

        setPendingKyc(pendingKyc);
        setCommissionRates(rates);
        setAnomalies(anomalies);
        setPendingRedemptions(redemptions);
        setVendors(vendorsList);
        setPartnerLeads(leads);
        
        setAllStockistCommissionRates(stockistCommissionRates);
        setAllPointsEarnConfigs(pointsEarnConfigs);
        setAllFeedbackReports(feedbackReports);

        // Fetch regions if empty
        if (regions.length === 0) {
          // Hardcode for display
          const regionsList = [
            { id: 'r1', name: 'Kolkata South (Garia)', code: 'kolkata-garia' },
            { id: 'r2', name: 'Rural West Bengal (Bishnupur)', code: 'rural-bishnupur' }
          ];
          setRegions(regionsList);
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

  // Sync DB Inspector tables directly
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
    }
    syncInspectorTable();
  }, [currentUser, activeRole, showDevSettings]);

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
      
      // Auto-select first stockist if none selected
      if (sData.length > 0 && !selectedStockist) {
        setSelectedStockist(sData[0]);
      }

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

  // Customer registration
  const handleCustomerRegister = async () => {
    if (!regName || !loginPhone) { showToast('Name and phone required', 'error'); return; }
    try {
      const payload = { phone: loginPhone, name: regName, regionId: regRegion, address: regAddress };
      const res = await fetch(`${API_BASE}/auth/register-customer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      logApi('POST', '/auth/register-customer', payload, res.status, data);
      if (res.ok) {
        setCurrentUser(data.user);
        setSelectedRegionId(data.user.region_id);
        showToast(t(`Welcome, ${data.user.name}!`, `स्वागत, ${data.user.name}!`, `স্বাগতম, ${data.user.name}!`));
        setShowCustomerSignup(false);
        setRegName(''); setRegAddress(''); setOtpSent(false);
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (err) { showToast('Registration error', 'error'); }
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
        showToast(`Redeemed ${redeemAmount} points against ISP bill! (বিল ডিসকাউন্ট করা হয়েছে)`);
        setDiscountApplied(prev => prev + parseFloat(redeemAmount));
        setRedeemAmount('');
        loadCustomerData();
        if (tourStep === 3) {
          setTourStep(4);
        }
      } else {
        showToast(data.error || 'Redemption failed', 'error');
      }
    } catch (err) {
      showToast('Redemption service error', 'error');
    }
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
    try {
      const payload = {
        name: newProdName,
        price: parseFloat(newProdPrice),
        costPrice: newProdCostPrice ? parseFloat(newProdCostPrice) : parseFloat(newProdPrice) * 0.75,
        category: newProdCategory,
        initialStock: parseInt(newProdInitialStock, 10),
        stockistId: stockistProfile.id,
        regionId: currentUser.region_id
      };
      
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Product ${newProdName} added successfully!`, 'success');
        setShowAddProductModal(false);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdCostPrice('');
        setNewProdCategory('groceries');
        setNewProdInitialStock('10');
        loadStockistData();
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to add product', 'error');
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

    try {
      const payload = {
        name: editProdName,
        price: priceNum,
        costPrice: costNum,
        stockistId: stockistProfile.id
      };
      const res = await fetch(`${API_BASE}/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Product updated successfully!', 'success');
        setEditingProduct(null);
        loadStockistData();
        fetchDbState();
      } else {
        showToast(data.error || 'Failed to update product', 'error');
      }
    } catch (err) {
      showToast('Network error updating product', 'error');
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

  const renderAuthForm = () => {
    return (
      <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', marginBottom: '0.75rem' }}>
            <Smartphone size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Phone OTP Login</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Hyperlocal ISP Commerce Login</p>
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
              <div style={{ marginTop: '0.25rem' }}>• 9876543210 (Customer Garia)</div>
              <div>• 8765432109 (Customer Bishnupur)</div>
              <div>• 7654321098 (Stockist Garia)</div>
              <div>• 4321098765 (Stockist Garia — Banerjee Corner)</div>
              <div>• 6543210987 (Stockist Bishnupur)</div>
            </div>

            {/* New account? signup links on pre-OTP screen too */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>New to FastNet?</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  onClick={() => { handleSendOtp(); setShowCustomerSignup(true); setShowStockistSignup(false); }}>
                  <UserPlus size={12} /> {t("Customer Sign Up", "ग्राहक पंजीकरण", "ক্রেতা নিবন্ধন")}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  onClick={() => { handleSendOtp(); setShowStockistSignup(true); setShowCustomerSignup(false); }}>
                  <Store size={12} /> {t("Open a Shop", "दुकान खोलें", "দোকান খুলুন")}
                </button>
              </div>
            </div>
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
                <option value="r1">Kolkata South (Garia)</option>
                <option value="r2">Rural West Bengal (Bishnupur)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('Delivery Address (Optional)', 'डिलीवरी पता', 'ডেলিভারি ঠিকানা')}</label>
              <input type="text" placeholder="e.g. 12 Main Road, Garia" className="text-input" value={regAddress} onChange={e => setRegAddress(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowCustomerSignup(false); setOtpSent(false); }}>← {t('Back', 'वापस', 'ফিরে')}</button>
              <button className="btn btn-accent" style={{ flex: 2 }} onClick={handleCustomerRegister}>{t('Create Account', 'खाता बनाएं', 'অ্যাকাউন্ট তৈরি')}</button>
            </div>
          </>
        ) : showStockistSignup ? (
          /* Stockist Sign Up Flow */
          <>
            <div style={{ background: 'rgba(245,158,11,0.08)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem', textAlign: 'center' }}>
              <Store size={14} style={{ color: 'var(--warning)', marginRight: '0.35rem', verticalAlign: 'middle' }} />
              {t('Register Local Shop (KYC Required)', 'स्थानीय दुकान पंजीकरण (KYC आवश्यक)', 'স্থানীয় দোকান নিবন্ধন (KYC প্রয়োজন)')} — {loginPhone}
            </div>
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
                <option value="r1">Kolkata South (Garia)</option>
                <option value="r2">Rural West Bengal (Bishnupur)</option>
              </select>
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  onClick={() => setShowCustomerSignup(true)}>
                  <UserPlus size={12} /> {t("Sign Up (Customer)", "साइन अप (ग्राहक)", "সাইন আপ (ক্রেতা)")}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  onClick={() => setShowStockistSignup(true)}>
                  <Store size={12} /> {t("Open a Shop", "दुकान खोलें", "দোকান খুলুন")}
                </button>
              </div>
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
            <button className="btn" onClick={() => setActiveRole('customer')}>Shop Groceries Now</button>
            <button className="btn btn-secondary" onClick={() => setActiveRole('admin')}>Open Admin Console</button>
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
                {renderAuthForm()}
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
                                  <strong style={{ color: 'white' }}>{o.pickup_slot || t('Not set', 'निर्धारित नहीं', 'নির্ধারিত নেই')}</strong>
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
                          {['09:00–10:00','10:00–11:00','11:00–12:00','12:00–13:00','14:00–15:00','15:00–16:00','16:00–17:00','17:00–18:00'].map(s => <option key={s} value={s}>{s}</option>)}
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
                          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Select Local Grocery Store</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {customerStockists.map(s => (
                              <div key={s.id} className="glass-card" style={{ padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <h4 style={{ fontSize: '0.85rem', color: 'white' }}>{s.name}</h4>
                                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', alignItems: 'center' }}>
                                    <span className="badge badge-success" style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}><Check size={9} style={{ display: 'inline', marginRight: '0.15rem' }} />{s.reliabilityBadge || 'Verified'}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Delivery: {s.delivery_radius_km}km radius</span>
                                  </div>
                                </div>
                                <button className="btn btn-accent" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setSelectedStockist(s)}>
                                  Shop (বাজার করুন)
                                </button>
                              </div>
                            ))}
                            {customerStockists.length === 0 && (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>No stores active in your area.</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setSelectedStockist(null)}>
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
                                      <h4 style={{ fontSize: '0.75rem', color: 'white' }}>{p.name}</h4>
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
                          {cartFulfillment === 'PICKUP' && (() => {
                            const groups = {};
                            customerCart.forEach(item => {
                              if (!groups[item.stockistId]) groups[item.stockistId] = item.stockistName;
                            });
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.65rem', color: slotError ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: slotError ? 'bold' : 'normal' }}>
                                  <Clock size={10} /> {t('Select Pickup Slot (Required)', 'पिकअप समय चुनें (आवश्यक)', 'পিকআপ সময় নির্বাচন করুন (প্রয়োজনীয়)')}
                                </div>
                                {Object.entries(groups).map(([sid, sName]) => {
                                  const stockist = customerStockists.find(s => s.id === sid) || { id: sid, opening_time: '08:00', closing_time: '20:00', prep_eta_minutes: 10 };
                                  const SLOTS = getAvailableSlots(stockist);
                                  return (
                                    <div key={sid} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{sName}:</div>
                                      <select
                                        className="text-input"
                                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem', border: slotError && !cartPickupSlots[sid] ? '1px solid var(--danger)' : '1px solid var(--border-color)' }}
                                        value={cartPickupSlots[sid] || ''}
                                        onChange={e => { setCartPickupSlots(prev => ({ ...prev, [sid]: e.target.value })); setSlotError(false); }}
                                      >
                                        <option value="">{t('-- Pick a time slot --', '-- समय स्लॉट चुनें --', '-- সময় স্লট বেছে নিন --')}</option>
                                        {SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                      </select>
                                    </div>
                                  );
                                })}
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

                  {customerAppTab === 'ledger' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Points Balance Card (Moderated) */}
                      <div className="points-glow-box" style={{ padding: '1.25rem 0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('ACCUMULATED LOYALTY POINTS', 'संचित लॉयल्टी पॉइंट्स', 'সঞ্চিত লয়্যালটি পয়েন্ট')}
                        </span>
                        <h1 style={{ fontSize: '1.75rem', margin: '0.25rem 0', color: 'white', fontWeight: 'bold' }}>{formatPoints(customerBalance)}</h1>
                        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', margin: 0 }}>
                          {t('Closed-loop points redeemable in the Rewards tab.', 'पुरस्कार टैब में रिडीम करने योग्य पॉइंट्स।', 'রিওয়ার্ডস ট্যাবে রিডিম করার যোগ্য পয়েন্ট।')}
                        </p>
                      </div>

                      <h3 style={{ fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
                        {t('Points History', 'पॉइंट इतिहास', 'পয়েন্ট इतिहास')}
                      </h3>
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
                            {t('No transactions recorded.', 'कोई लेन-देन दर्ज नहीं है।', 'কোনো লেনদেন রেকর্ড করা হয়নি।')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {customerAppTab === 'pointshop' && (() => {
                    const redeemItem = async (cost, type, label) => {
                      if (customerBalance < cost) { showToast(`Need ${formatPoints(cost)} — you have ${formatPoints(customerBalance)}`, 'error'); return; }
                      try {
                        const res = await fetch(`${API_BASE}/ledger/redeem`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ customerId: currentUser.id, amount: cost, redemptionType: type })
                        });
                        if (res.ok) { showToast(`Success: ${label} redeemed!`); loadCustomerData(); }
                        else { const d = await res.json(); showToast(d.error || 'Redemption failed', 'error'); }
                      } catch (e) { showToast('Redemption error', 'error'); }
                    };

                    const shopItems = [
                      {
                        category: t('Broadband & WiFi', 'ब्रॉडबैंड और वाईफाई', 'ব্রডব্যান্ড ও ওয়াইফাই'),
                        color: '#6366f1',
                        items: [
                          { label: t('Bill Discount — ₹50 off', 'बिल डिस्काउंट — ₹50 छूट', 'বিল ডিসকাউন্ট — ₹৫০ ছাড়'), sub: t('Instantly off your next monthly broadband bill', 'अगले मासिक ब्रॉडबैंड बिल से तुरंत छूट', 'আপনার পরবর্তী ব্রডব্যান্ড বিল থেকে সাথে সাথে ছাড়'), pts: 50, type: 'BROADBAND_DISCOUNT_50', icon: 'bill' },
                          { label: t('Bill Discount — ₹100 off', 'बिल डिस्काउंट — ₹100 छूट', 'বিল ডিসকাউন্ট — ₹১০০ ছাড়'), sub: t('For power users. Cuts bill by ₹100 this month', 'पावर उपयोगकर्ताओं के लिए। इस महीने बिल ₹100 कम करें', 'পাওয়ার ইউজারদের জন্য। এই মাসের বিলে ১০০ টাকা ছাড়'), pts: 100, type: 'BROADBAND_DISCOUNT_100', icon: 'bill' },
                          { label: t('Speed Booster 48h (100 Mbps)', 'स्पीड बूस्टर 48h (100 Mbps)', 'স্পিড বুস্টার ৪৮ ঘণ্টা (১০০ Mbps)'), sub: t('2 days of priority bandwidth. No throttling.', '२ दिनों की प्राथमिकता बैंडविड्थ। कोई सीमा नहीं।', '২ দিন হাই স্পিড ব্যান্ডউইডথ পাবেন।'), pts: 150, type: 'WIFI_TOPUP', icon: 'wifi' },
                          { label: t('Data Top-up 10 GB', 'डेटा टॉप-अप 10 GB', 'ডাটা টপ-আপ ১০ জিবি'), sub: t('Extra 10 GB added to your plan instantly', 'आपके प्लान में तुरंत १० जीबी अतिरिक्त जोड़ा गया', 'আপনার অ্যাকাউন্টে সরাসরি ১০ জিবি ডাটা যোগ হবে'), pts: 80, type: 'DATA_TOPUP', icon: 'wifi' },
                        ]
                      },
                      {
                        category: t('Cable TV', 'केबल टीवी', 'কেবল টিভি'),
                        color: '#ec4899',
                        items: [
                          { label: t('Basic Pack — 1 Month Free', 'बुनियादी पैक — १ महीना मुफ्त', 'বেসিক প্যাক — ১ মাস ফ্রি'), sub: t('30 days of regional & local channels', 'क्षेत्रीय और स्थानीय चैनलों के ३० दिन', '৩০ দিন সব লোকাল ও আঞ্চলিক চ্যানেল দেখতে পাবেন'), pts: 100, type: 'CABLE_RECHARGE', icon: 'tv' },
                          { label: t('HD Premium Pack — 1 Month', 'एचडी प्रीमियम पैक — १ महीना', 'এইচডি প্রিমিয়াম প্যাক — ১ মাস'), sub: t('Sports, Movies, News HD channels', 'खेल, सिनेमा, समाचार एचडी चैनल', 'সব স্পোর্টস, মুভি ও নিউজ এইচডি চ্যানেল পাবেন'), pts: 250, type: 'CABLE_RECHARGE', icon: 'tv' },
                          { label: t('Kids & Family Bundle', 'किड्स एंड फैमिली बंडल', 'কিডস ও ফ্যামিলি বান্ডেল'), sub: t('Cartoon Network, Pogo & family channels', 'कार्टून नेटवर्क, पोगो और पारिवारिक चैनल', 'কার্টুন নেটওয়ার্ক, পোগো ও ফ্যামিলি চ্যানেল প্যাক'), pts: 120, type: 'CABLE_RECHARGE', icon: 'tv' },
                        ]
                      },
                    ];

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Header Hero */}
                        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(236,72,153,0.15) 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '14px', padding: '1rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{t('Your Balance', 'आपका बैलेंस', 'আপনার ব্যালেন্স')}</div>
                          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>{formatPoints(customerBalance)}</div>
                          <div style={{ fontSize: '0.6rem', color: '#818cf8', marginTop: '0.35rem' }}>{t('Redeemable across FastNet broadband, wifi, and cable TV plans', 'फास्टनेट ब्रॉडबैंड, वाईफाई और केबल टीवी प्लान में रिडीम करने योग्य', 'ফাস্টনেট ব্রডব্যান্ড, ওয়াইফাই এবং কেবল টিভি প্ল্যানে রিডিম করার যোগ্য')}</div>
                          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {shopItems.map(cat => (
                              <span key={cat.category} style={{ fontSize: '0.55rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}44` }}>{cat.category}</span>
                            ))}
                          </div>
                        </div>

                        {/* Catalog Sections */}
                        {shopItems.map(cat => (
                          <div key={cat.category}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                              <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: cat.color }} />
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>{cat.category}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {cat.items.map(item => {
                                const canAfford = customerBalance >= item.pts;
                                return (
                                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.75rem', borderRadius: '10px', background: canAfford ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)', border: `1px solid ${canAfford ? cat.color + '33' : 'rgba(255,255,255,0.05)'}`, opacity: canAfford ? 1 : 0.55, transition: 'all 0.2s' }}>
                                    <div style={{ flexShrink: 0, width: '32px', display: 'flex', justifyContent: 'center' }}>
                                      {item.icon === 'bill' && <FileText size={20} style={{ color: cat.color }} />}
                                      {item.icon === 'wifi' && <Signal size={20} style={{ color: cat.color }} />}
                                      {item.icon === 'tv' && <Tv size={20} style={{ color: cat.color }} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'white', lineHeight: 1.2 }}>{item.label}</div>
                                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.sub}</div>
                                      <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: cat.color, marginTop: '0.2rem' }}>{formatPoints(item.pts)}</div>
                                    </div>
                                    <button
                                      id={`redeem-${item.type}`}
                                      disabled={!canAfford}
                                      onClick={() => redeemItem(item.pts, item.type, item.label)}
                                      style={{ flexShrink: 0, padding: '0.35rem 0.6rem', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed', background: canAfford ? cat.color : 'rgba(255,255,255,0.1)', color: canAfford ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}
                                    >
                                      {t('Redeem', 'रिडीम', 'রিডিম')}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                          Points earned from FastNet grocery orders · Redeemable against FastNet services only · Non-transferable
                        </div>
                      </div>
                    );
                  })()}

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
                                    <span>{t('Mode: Take Away', 'मोड: पिकअप', 'অবস্থা: पिकअप')} ({o.pickup_slot || t('Pending slot', 'स्लॉट लंबित', 'স্লট পেন্ডিং')})</span>
                                  </>
                                )}
                              </div>

                              {/* Static slot display + Change Slot button inside orders list if pickup is chosen */}
                              {o.status !== 'DELIVERED' && o.fulfillment_type === 'PICKUP' && (
                                <div style={{ border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '0.5rem', marginTop: '0.25rem', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                      {t('Selected Slot:', 'चुना गया स्लॉट:', 'নির্ধারিত স্লট:')} <strong style={{ color: 'white' }}>{o.pickup_slot || t('None', 'कोई नहीं', 'কোনোটি না')}</strong>
                                    </span>
                                    
                                    {!['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(o.status) && (
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
                                            <option key={slot} value={slot}>{slot}</option>
                                          ))}
                                        </select>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {o.fulfillment_type === 'PICKUP' && o.status !== 'DELIVERED' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.35rem', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.05)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Key size={12} style={{ color: 'var(--primary)' }} />
                                  <span>{t('Pickup PIN:', 'पिकअप पिन:', 'পিকআপ কোড:')} <strong style={{ color: 'white', letterSpacing: '0.05em' }}>{o.pickup_pin || '1234'}</strong></span>
                                </div>
                              )}

                              {renderCancelButtonOrClosed(o)}

                              {/* §F19: No-show alert for missed pickup */}
                              {o.status === 'READY_FOR_PICKUP' && o.fulfillment_type === 'PICKUP' && (
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
        { key: 'PENDING', label: t('Received', 'प्राप्त', 'গৃহীত') },
        { key: 'ACCEPTED', label: t('Accepted', 'स्वीकृत', 'স্বীকৃত') },
        { key: 'PREPARING', label: t('Packing', 'पैकिंग', 'প্যাকিং') },
        isPickup 
          ? { key: 'READY_FOR_PICKUP', label: t('Ready for Pickup', 'पिकअप के लिए तैयार', 'পিকআপের জন্য প্রস্তুত') }
          : { key: 'OUT_FOR_DELIVERY', label: t('Out for Delivery', 'वितरण के लिए बाहर', 'ডেলিভারির জন্য পাঠানো হয়েছে') },
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
                {renderAuthForm()}
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
                          const isNew = ['PENDING', 'CONFIRMING'].includes(o.status);
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
                                  {['PENDING', 'CONFIRMING'].includes(o.status) && (
                                    <button className="btn" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'ACCEPTED')}>
                                      {t('Accept', 'स्वीकार करें', 'গ্রহণ করুন')}
                                    </button>
                                  )}
                                  {o.status === 'ACCEPTED' && (
                                    <button className="btn btn-accent" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'PREPARING')}>
                                      {t('Prepare', 'तैयार करें', 'প্যাক করুন')}
                                    </button>
                                  )}
                                  {o.status === 'PREPARING' && (
                                    <button className="btn btn-accent" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, o.fulfillment_type === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY')}>
                                      {o.fulfillment_type === 'PICKUP' ? t('Mark Ready', 'तैयार चिह्नित करें', 'রেডি চিহ্নিত করুন') : t('Deliver', 'वितरण करें', 'ডেলিভারি করুন')}
                                    </button>
                                  )}
                                  {['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status) && (
                                    o.fulfillment_type === 'PICKUP' ? (
                                      <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                                        <input 
                                          type="text" 
                                          placeholder={t("Enter PIN", "पिन दर्ज करें", "পিন লিখুন")} 
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
                                    ) : (
                                      <button className="btn" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem', background: 'var(--accent)' }} onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}>
                                        {t('Complete & Pay', 'पूरा करें और भुगतान करें', 'সম্পন্ন ও পেমেন্ট করুন')}
                                      </button>
                                    )
                                  )}
                                  {['PENDING', 'CONFIRMING'].includes(o.status) && (
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
                              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("Today's Sales", "आज की बिक्री", "আজকের বিক্রি")}</span>
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
                                {analyticsRange === 'weekly' ? t('7-Day Sales Trend (₹)', '7-दिवसीय बिक्री रुझान (₹)', '৭-দিনের সেলস ট্রেন্ড (₹)') : t('4-Week Sales Trend (₹)', '4-सप्ताह बिक्री रुझान (₹)', '৪-সप्ताहের সেলस ट्रेंड (₹)')}
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

          <div className="admin-grid">
            <div className="admin-sidebar">
              <button className={`admin-nav-item ${adminTab === 'kyc' ? 'active' : ''}`} onClick={() => setAdminTab('kyc')}>
                <UserCheck size={16} /> Shop Approvals Queue ({pendingKyc.length})
              </button>
              <button className={`admin-nav-item ${adminTab === 'rates' ? 'active' : ''}`} onClick={() => setAdminTab('rates')}>
                <Settings size={16} /> Commission & Points Config
              </button>
              <button className={`admin-nav-item ${adminTab === 'feedback' ? 'active' : ''}`} onClick={() => setAdminTab('feedback')}>
                <ShieldAlert size={16} /> Feedback & Reports ({allFeedbackReports.length})
              </button>
              <button className={`admin-nav-item ${adminTab === 'anomalies' ? 'active' : ''}`} onClick={() => setAdminTab('anomalies')}>
                <ShieldAlert size={16} /> Flagged Store Orders ({anomalies.length})
              </button>
              <button className={`admin-nav-item ${adminTab === 'redemptions' ? 'active' : ''}`} onClick={() => setAdminTab('redemptions')}>
                <ArrowRightLeft size={16} /> Subscriber Bill Discounts ({pendingRedemptions.filter(r=>r.billing_sync_status==='PENDING').length})
              </button>
              <button className={`admin-nav-item ${adminTab === 'vendors' ? 'active' : ''}`} onClick={() => setAdminTab('vendors')}>
                <ShoppingBag size={16} /> Wholesalers ({vendors.length})
              </button>
              <button className={`admin-nav-item ${adminTab === 'transactions' ? 'active' : ''}`} onClick={() => setAdminTab('transactions')}>
                <ArrowRightLeft size={16} /> All Transactions {refundDueCount > 0 && <span className="badge badge-danger" style={{ marginLeft: '0.25rem', fontSize: '0.65rem' }}>{refundDueCount}</span>}
              </button>
              <button className={`admin-nav-item ${adminTab === 'leads' ? 'active' : ''}`} onClick={() => setAdminTab('leads')}>
                <UserCheck size={16} /> Partner Leads ({partnerLeads.length})
              </button>
            </div>

            <div className="admin-content">
              
              {adminTab === 'kyc' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Shopkeeper Registration Queue</h2>
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
                        <th>Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingKyc.map(u => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.phone}</td>
                          <td>{u.region_id === 'r1' ? 'Kolkata South' : 'Rural Bishnupur'}</td>
                          <td>{u.kyc_details?.id_type}</td>
                          <td>{u.kyc_details?.id_number}</td>
                          <td>{u.kyc_details?.shop_address}</td>
                          <td>
                            <button className="btn btn-accent" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleApproveKyc(u.id)}>
                              Approve Shop
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pendingKyc.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No pending registrations found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'rates' && (
                <div>
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>ISP Commission & Customer Points Config</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Set regional percentage charges or override rates per shop, and independently configure customer point earn rates.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* LEFT COLUMN: COMMISSION SETUP */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4>Configure Regional Commission</h4>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>* This percentage represents what the platform retains from sales in this region.</p>
                        <div className="input-group">
                          <label className="input-label">Region</label>
                          <select className="text-input" value={configRegion} onChange={e => setConfigRegion(e.target.value)}>
                            <option value="r1">Kolkata South (Garia)</option>
                            <option value="r2">Rural West Bengal (Bishnupur)</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Category</label>
                          <input type="text" className="text-input" value={configCategory} onChange={e => setConfigCategory(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Commission Rate (%)</label>
                          <input type="number" className="text-input" value={configRate} onChange={e => setConfigRate(parseFloat(e.target.value))} />
                        </div>
                        <button className="btn" onClick={handleSaveCommissionRate}>Save Regional Config</button>
                      </div>

                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4>Configure Shop Commission Override</h4>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>* Overrides the regional commission rate. This is the portion retained by the platform from this shop's sales.</p>
                        <div className="input-group">
                          <label className="input-label">Select Shop</label>
                          <select className="text-input" value={selectedStockistForCommission} onChange={e => setSelectedStockistForCommission(e.target.value)}>
                            <option value="">-- Select a Shop --</option>
                            {customerStockists.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Override Rate (%)</label>
                          <input type="number" className="text-input" value={configStockistRate} onChange={e => setConfigStockistRate(parseFloat(e.target.value))} />
                        </div>
                        <button className="btn" onClick={() => handleSaveStockistCommission(selectedStockistForCommission, configStockistRate)} disabled={!selectedStockistForCommission}>
                          Save Shop Override
                        </button>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: POINTS CONFIGURATION & VIEWS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4>Configure Customer Points Earn Rate</h4>
                        <div className="input-group">
                          <label className="input-label">Region (Default Scope)</label>
                          <select className="text-input" value={earnRateRegion} onChange={e => setEarnRateRegion(e.target.value)}>
                            <option value="r1">Kolkata South (Garia)</option>
                            <option value="r2">Rural West Bengal (Bishnupur)</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Or Specific Shop Override</label>
                          <select className="text-input" value={earnRateStockist} onChange={e => setEarnRateStockist(e.target.value)}>
                            <option value="">-- Use Regional (Default) --</option>
                            {customerStockists.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Points Earn Rate (% of Profit Margin)</label>
                          <input type="number" className="text-input" value={earnRatePercent} onChange={e => setEarnRatePercent(parseFloat(e.target.value))} />
                        </div>
                        <button className="btn" onClick={() => handleSavePointsEarnConfig(earnRateRegion, earnRateStockist, earnRatePercent)}>
                          Save Points Rate Config
                        </button>
                      </div>

                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Active Configured Shop Overrides</span>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Shop ID</th>
                              <th>Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allStockistCommissionRates.map(scr => (
                              <tr key={scr.id}>
                                <td style={{ fontFamily: 'monospace' }}>{scr.stockist_id}</td>
                                <td>{scr.rate_percent}%</td>
                              </tr>
                            ))}
                            {allStockistCommissionRates.length === 0 && (
                              <tr>
                                <td colSpan="2" style={{ color: 'var(--text-muted)' }}>No overrides set.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
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
                            <option value="r1">Kolkata South (Garia)</option>
                            <option value="r2">Rural West Bengal (Bishnupur)</option>
                          </select>
                        </div>
                        <button className="btn" onClick={handleCreateVendor}>Register Wholesaler</button>
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
                        <th>ISP Share</th>
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
                                {(o.payment_status === 'HELD' || o.payment_status === 'COD') && o.status === 'DELIVERED' && !o.split_released && (
                                  <button className="btn btn-accent" style={{ padding: '0.15rem 0.35rem', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }} onClick={() => handleReleaseSplit(o.id)}>
                                    <Banknote size={10} /> Release Split
                                  </button>
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
                  confirmModal.onConfirm();
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
          <button className={`role-tab ${activeRole === 'marketing' ? 'active' : ''}`} onClick={() => setActiveRole('marketing')}>
            B2B Site
          </button>
          <button className={`role-tab ${activeRole === 'customer' ? 'active' : ''}`} onClick={() => setActiveRole('customer')}>
            Customer App
          </button>
          <button className={`role-tab ${activeRole === 'stockist' ? 'active' : ''}`} onClick={() => setActiveRole('stockist')}>
            Stockist App
          </button>
          <button className={`role-tab ${activeRole === 'admin' ? 'active' : ''}`} onClick={() => setActiveRole('admin')}>
            Admin Portal
          </button>
          {showDevSettings && (
            <button className={`role-tab ${activeRole === 'db' ? 'active' : ''}`} onClick={() => setActiveRole('db')}>
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
    </div>
  );
}
