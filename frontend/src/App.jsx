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
  Gift
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

export default function App() {
  const [activeRole, setActiveRole] = useState('marketing');
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('r1');
  const [currentUser, setCurrentUser] = useState(null);
  
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
  const [customerLedger, setCustomerLedger] = useState([]);
  const [customerBalance, setCustomerBalance] = useState(0);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerAppTab, setCustomerAppTab] = useState('store'); // store, ledger, orders
  const [redeemAmount, setRedeemAmount] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);

  // New expansion states
  const [activeFulfillmentOrder, setActiveFulfillmentOrder] = useState(null);
  const [selectedPickupSlot, setSelectedPickupSlot] = useState(null);
  const [allStockistCommissionRates, setAllStockistCommissionRates] = useState([]);
  const [allPointsEarnConfigs, setAllPointsEarnConfigs] = useState([]);
  const [allFeedbackReports, setAllFeedbackReports] = useState([]);
  const [submittingFeedbackOrder, setSubmittingFeedbackOrder] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackReason, setFeedbackReason] = useState('');
  
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
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCostPrice, setNewProdCostPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('groceries');
  const [newProdInitialStock, setNewProdInitialStock] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('15');

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
  const [adminTab, setAdminTab] = useState('kyc'); // kyc, rates, anomalies, redemptions, vendors
  const [pendingKyc, setPendingKyc] = useState([]);
  const [commissionRates, setCommissionRates] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [pendingRedemptions, setPendingRedemptions] = useState([]);
  const [adminNewVendor, setAdminNewVendor] = useState('');
  
  // Rate config form
  const [configCategory, setConfigCategory] = useState('groceries');
  const [configRate, setConfigRate] = useState(10);
  const [configRegion, setConfigRegion] = useState('r1');

  // Simulator Shell State
  const [dbState, setDbState] = useState(null);
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
            const pendingOrder = oData.find(o => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'SHIPPED');
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
    if (askConfirm && !window.confirm('Are you sure you want to reset all demo data and start fresh? All custom orders and KYC logs will be deleted.')) return;
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
        desc: "Role: Customer App. Put fresh groceries in the cart, pick your pickup slot or delivery preference, and checkout. Watch loyalty points credit immediately on item profit margins.",
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

        setPendingKyc(pendingKyc);
        setCommissionRates(rates);
        setAnomalies(anomalies);
        setPendingRedemptions(redemptions);
        setVendors(vendorsList);
        
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
          feedback_reports: feedbackReports
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

      setDbState({
        orders: list,
        commission_rates: rates,
        anomaly_logs: anomalies,
        points_ledger: red,
        products: prods,
        vendors: vens,
        stockist_commission_rates: scrs,
        points_earn_config: pecs,
        feedback_reports: fbs
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
      if (prev.length > 0 && prev[0].stockistId !== selectedStockist.id) {
        showToast(`Cleared previous items to start a new order at ${selectedStockist.name}`, 'info');
        return [{ product, quantity: 1, stockistId: selectedStockist.id, stockistName: selectedStockist.name }];
      }
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
  const cartTotal = cartSubtotal; // Zero delivery fee at checkout (§7), zero low-order fee (§3)
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

    try {
      const ordersPlaced = [];
      let totalPoints = 0;

      for (const stockistId of Object.keys(groups)) {
        const payload = {
          customerId: currentUser.id,
          stockistId: stockistId,
          items: groups[stockistId].map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        };

        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        logApi('POST', '/orders', payload, res.status, data);

        if (res.ok) {
          ordersPlaced.push(data.order || data);
          totalPoints += data.pointsCredited;
        } else {
          showToast(data.error || 'Failed to place order', 'error');
          return;
        }
      }

      setCheckoutResult({
        success: true,
        orders: ordersPlaced,
        totalPointsCredited: totalPoints
      });
      setCustomerCart([]);
      loadCustomerData();
      showToast(`Order placed successfully! Credited ${totalPoints} pts in rewards.`);
      if (tourStep === 1) {
        setTourStep(2);
      }
    } catch (err) {
      showToast('Checkout service error', 'error');
    }
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
          reason: feedbackReason
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
          reason: feedbackReason
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

  const handleResetDb = () => performReset(true);

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
              <div>• 6543210987 (Stockist Bishnupur)</div>
            </div>
          </>
        ) : (
          <>
            <div className="input-group" style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.75rem', textAlign: 'center' }}>
              We sent a mock OTP to <strong>{loginPhone}</strong>. Use code <strong>123456</strong> to verify.
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
              <button className="btn" style={{ flex: 2 }} onClick={handleVerifyOtp}>Verify & Login</button>
            </div>

            {/* Registration fields if it fails or if new */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingT: '1rem', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem' }}>
                Don't have an account? Sign up below:
              </p>
              
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Joy Dev" 
                  className="text-input"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Select Region</label>
                <select className="text-input" value={regRegion} onChange={e => setRegRegion(e.target.value)}>
                  <option value="r1">Kolkata South (Garia)</option>
                  <option value="r2">Rural West Bengal (Bishnupur)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <input 
                  type="checkbox" 
                  id="regStockist" 
                  checked={regIsStockist} 
                  onChange={e => setRegIsStockist(e.target.checked)} 
                />
                <label htmlFor="regStockist" style={{ fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Register as Stockist (Requires KYC)
                </label>
              </div>

              {regIsStockist && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">ID Document Type</label>
                    <select className="text-input" value={regKycType} onChange={e => setRegKycType(e.target.value)}>
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Trade License">Trade License</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Document ID Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1234-5678-9012" 
                      className="text-input" 
                      value={regKycNumber}
                      onChange={e => setRegKycNumber(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Shop Address</label>
                    <input 
                      type="text" 
                      placeholder="Enter detailed shop address" 
                      className="text-input" 
                      value={regAddress}
                      onChange={e => setRegAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button className="btn btn-accent" style={{ width: '100%' }} onClick={handleRegister}>
                Register & Verify
              </button>
            </div>
          </>
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
                <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0 }}>Business Retention Calculator (অপারেটর হিসাব)</h3>
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
                    <span className="input-label">Avg. Monthly Broadband Bill</span>
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
          <h2 style={{ marginBottom: '1rem' }}>Onboard a Pilot Tenant</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Deploy a new region or operator. Instantly creates separate data structures under `tenant_id` and `region_id`.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}>
            <input type="text" placeholder="Operator Name (e.g. Alliance Broadband)" className="text-input" style={{ flex: 1 }} />
            <button className="btn" onClick={() => showToast('Tenant request queued for Admin approval.')}>Request Demo</button>
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
          <span>👤 CUSTOMER VIEW (ক্রেতা মোড): {isLoggedOut ? "Not logged in (লগইন করা নেই)" : `${currentUser.name} (${activeRegionName})`}</span>
        </div>
        
        <div className="phone-mockup">
          <div className="phone-notch"></div>
          <div className="phone-screen">
            {isLoggedOut ? (
              <>
                <div className="phone-header">
                  <span>FastNet 5G</span>
                  <span>📶 🔋 19:43</span>
                </div>
                {/* Localized Auth Form */}
                <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center', height: '100%' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                      <Smartphone size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Phone OTP Login (লগইন করুন)</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>FastNet Hyperlocal Storefront Access</p>
                  </div>

                  {!otpSent ? (
                    <>
                      <div className="input-group">
                        <label className="input-label">Phone Number (মোবাইল নম্বর)</label>
                        <input 
                          type="tel" 
                          placeholder="Enter 10-digit mobile number" 
                          className="text-input" 
                          value={loginPhone}
                          onChange={e => setLoginPhone(e.target.value.replace(/\D/g,'').substring(0,10))}
                        />
                      </div>
                      <button className="btn" onClick={handleSendOtp}>Send Code (ওটিপি পাঠান / OTP Bhejo)</button>
                      
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                        <strong>Demo Accounts:</strong>
                        <div style={{ marginTop: '0.25rem' }}>• 9876543210 (Amit - Customer Garia)</div>
                        <div>• 8765432109 (Radha - Customer Bishnupur)</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="input-group" style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.75rem', textAlign: 'center' }}>
                        OTP sent to <strong>{loginPhone}</strong>. Use demo code <strong>123456</strong>.
                      </div>
                      <div className="input-group">
                        <label className="input-label">Enter 6-Digit OTP (কোড লিখুন)</label>
                        <input 
                          type="text" 
                          placeholder="123456" 
                          maxLength={6}
                          className="text-input" 
                          value={loginOtp}
                          onChange={e => setLoginOtp(e.target.value.replace(/\D/g,''))}
                          style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 'bold' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setOtpSent(false)}>Back</button>
                        <button className="btn" style={{ flex: 2 }} onClick={handleVerifyOtp}>Verify (যাচাই করুন / Login)</button>
                      </div>

                      {/* Registration section */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem' }}>
                          Create a new customer account:
                        </p>
                        
                        <div className="input-group">
                          <label className="input-label">Your Name (নাম)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Joy Dev" 
                            className="text-input"
                            value={regName}
                            onChange={e => setRegName(e.target.value)}
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Select Region (অঞ্চল)</label>
                          <select className="text-input" value={regRegion} onChange={e => setRegRegion(e.target.value)}>
                            <option value="r1">Kolkata South (Garia)</option>
                            <option value="r2">Rural West Bengal (Bishnupur)</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                          <input 
                            type="checkbox" 
                            id="regStockist" 
                            checked={regIsStockist} 
                            onChange={e => setRegIsStockist(e.target.checked)} 
                          />
                          <label htmlFor="regStockist" style={{ fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                            Register as local Shopkeeper
                          </label>
                        </div>

                        {regIsStockist && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                            <div className="input-group">
                              <label className="input-label">ID Document Type</label>
                              <select className="text-input" value={regKycType} onChange={e => setRegKycType(e.target.value)}>
                                <option value="Aadhaar">Aadhaar Card</option>
                                <option value="Voter ID">Voter ID</option>
                                <option value="Trade License">Trade License</option>
                              </select>
                            </div>
                            <div className="input-group">
                              <label className="input-label">ID Number</label>
                              <input 
                                type="text" 
                                placeholder="e.g. 1234-5678-9012" 
                                className="text-input" 
                                value={regKycNumber}
                                onChange={e => setRegKycNumber(e.target.value)}
                              />
                            </div>
                            <div className="input-group">
                              <label className="input-label">Shop Address</label>
                              <input 
                                type="text" 
                                placeholder="Enter detailed shop address" 
                                className="text-input" 
                                value={regAddress}
                                onChange={e => setRegAddress(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <button className="btn btn-accent" style={{ width: '100%', marginTop: '1rem' }} onClick={handleRegister}>
                          Sign Up & Login
                        </button>
                      </div>
                    </>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Demo customer: <strong>9876543210</strong> (Code: 123456)</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Simulated Phone Status Bar */}
                <div className="phone-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>FastNet 5G</span>
                    <span className="badge badge-success" style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>{customerBalance} pts</span>
                  </div>
                  <span>📶 🔋 19:43</span>
                </div>

                {/* Checkout Success Modal overlay */}
                {checkoutResult && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.97)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '1.25rem', overflowY: 'auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
                      <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                        <CheckCircle2 size={36} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'white' }}>Order Placed (অর্ডার সফল হয়েছে)</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Rewards will credit immediately, configure your fulfillment below.</p>
                    </div>

                    <div className="points-glow-box" style={{ padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Rewards Credited</span>
                      <h2 style={{ fontSize: '1.8rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                        <Sparkles size={20} style={{ color: 'var(--warning)' }} />
                        +{checkoutResult.totalPointsCredited} pts
                      </h2>
                    </div>

                    {/* Fulfillment Setup Block for placed orders */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Fulfillment Settings</h4>
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
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Status: Take Away (Pickup)</span>
                                  {!isPrepElapsed ? (
                                    <button 
                                      className="btn btn-secondary" 
                                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.6rem' }} 
                                      onClick={() => setPrepElapsedOrders(prev => [...prev, o.id])}
                                    >
                                      Simulate Prep ETA Elapsed
                                    </button>
                                  ) : (
                                    <span style={{ color: 'var(--accent)', fontSize: '0.6rem', fontWeight: 'bold' }}>Ready for Pickup!</span>
                                  )}
                                </div>

                                <div className="input-group" style={{ margin: 0 }}>
                                  <select 
                                    className="text-input" 
                                    style={{ fontSize: '0.7rem', padding: '0.25rem' }} 
                                    disabled={!isPrepElapsed}
                                    value={o.pickup_slot || ''}
                                    onChange={e => handleSavePickupSlot(o.id, e.target.value)}
                                  >
                                    <option value="">-- Choose Pickup Time Slot --</option>
                                    <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
                                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                                    <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                                  </select>
                                  <p style={{ color: 'var(--text-muted)', fontSize: '0.55rem', marginTop: '0.2rem' }}>
                                    {!isPrepElapsed ? '⚠️ Waiting for stockist prep time (ETA: 10 min).' : '⏰ Buffer grace window: 1-hour to collect.'}
                                  </p>
                                </div>

                                <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed var(--primary)', borderRadius: '6px', padding: '0.4rem', marginTop: '0.4rem', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>🔑 Verification PIN (পিকআপ কোড):</span>
                                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-glow)', letterSpacing: '0.15em' }}>{o.pickup_pin || '1234'}</div>
                                </div>

                                <button 
                                  className="btn" 
                                  style={{ width: '100%', padding: '0.3rem', fontSize: '0.65rem', marginTop: '0.5rem', background: 'rgba(236,72,153,0.1)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }}
                                  onClick={() => handleSwitchToDelivery(o.id)}
                                >
                                  Switch to Delivery (+₹40)
                                </button>
                              </div>
                            ) : (
                              <div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 'bold' }}>🚚 Mode: DELIVERY (একমুখী ডেলিভারি)</span>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Shipping charges applied. Cannot switch back to pickup.</p>
                              </div>
                            )}

                            {/* Transparent Points Breakdown Receipt (§B3) */}
                            <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>💡 Point Breakdown (পয়েন্ট হিসাব):</div>
                              <div style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                                • English: You earned <strong>{o.pointsCredited || o.points_credited || 0} pts</strong> because this order's margin was <strong>₹{o.margin || (o.subtotal * 0.25).toFixed(1)}</strong> and your reward rate is <strong>{o.earnRatePercent || 40}%</strong>.
                              </div>
                              <div style={{ color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                • বাংলা: আপনি <strong>{o.pointsCredited || o.points_credited || 0} pts</strong> পেয়েছেন কারণ লাভ ছিল <strong>₹{o.margin || (o.subtotal * 0.25).toFixed(1)}</strong> ও হার <strong>{o.earnRatePercent || 40}%</strong>।
                              </div>
                              <div style={{ color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                • हिंदी: आपने <strong>{o.pointsCredited || o.points_credited || 0} pts</strong> कमाए हैं क्योंकि मुनाफा <strong>₹{o.margin || (o.subtotal * 0.25).toFixed(1)}</strong> व दर <strong>{o.earnRatePercent || 40}%</strong> है।
                              </div>
                            </div>

                            {/* WhatsApp Notification Share Trigger (§B1) */}
                            <button 
                              className="btn btn-secondary" 
                              style={{ width: '100%', padding: '0.35rem', fontSize: '0.65rem', marginTop: '0.35rem', background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                              onClick={() => {
                                const waMsg = `Hello! FastNet Supermarket order #${o.id.substring(2).toUpperCase()} confirmed at ${o.stockist_name} for ₹${o.total_price}. Pickup PIN: ${o.pickup_pin || 'N/A'}. Subtotal: ₹${o.subtotal}. I earned ${o.pointsCredited || o.points_credited || 0} pts discount!`;
                                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`, '_blank');
                              }}
                            >
                              💬 Share Order Status to WhatsApp (শেয়ার করুন)
                            </button>

                          </div>
                        );
                      })}
                    </div>

                    <button className="btn btn-accent" style={{ marginTop: 'auto' }} onClick={() => { setCheckoutResult(null); loadCustomerData(); }}>
                      Done & Continue Shopping
                    </button>
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
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Delivery: {s.delivery_radius_km}km radius</span>
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

                          {/* Catalog List */}
                          <h3 style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>Popular Staples (রোজকার বাজার)</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {customerProducts.map(p => {
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
                                          Earn {earnEst} pts
                                        </span>
                                      </div>
                                    </div>
                                    <button 
                                      className="btn btn-accent" 
                                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', height: '28px', background: isOutOfStock ? 'rgba(255,255,255,0.05)' : '', color: isOutOfStock ? 'var(--text-muted)' : '', border: isOutOfStock ? '1px solid rgba(255,255,255,0.05)' : '' }}
                                      disabled={isOutOfStock}
                                      onClick={() => addToCart(p)}
                                    >
                                      {isOutOfStock ? 'Out of Stock' : <><Plus size={12} /> Add</>}
                                    </button>
                                  </div>
                                  {isOutOfStock && (
                                    <AlternativeShops productName={p.name} regionId={currentUser.region_id} excludeStockistId={selectedStockist.id} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {/* Floating Unified Cart Panel */}
                      {customerCart.length > 0 && (
                        <div style={{ position: 'sticky', bottom: '0', background: 'var(--bg-surface-elevated)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: 'auto', boxShadow: '0 -5px 15px rgba(0,0,0,0.5)', zIndex: 50 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{customerCart.length} Items Selected</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent)' }}>₹{cartTotal.toFixed(2)}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            <span>Subtotal: ₹{cartSubtotal}</span>
                            <span>Est. Rewards: <strong style={{ color: 'var(--accent)' }}>+{estimatedEarnPoints} pts</strong></span>
                          </div>

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

                          <button className="btn" style={{ width: '100%', fontSize: '0.8rem' }} onClick={handleCheckout}>
                            Place Order (বাজারের অর্ডার দিন)
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {customerAppTab === 'ledger' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Points Balance Card (Moderated) */}
                      <div className="points-glow-box" style={{ padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ACCUMULATED LOYALTY POINTS</span>
                        <h1 style={{ fontSize: '1.5rem', margin: '0.15rem 0', color: 'white', fontWeight: 'bold' }}>{customerBalance} pts</h1>
                        <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Closed-loop points redeemable against issuing operator services.</p>
                      </div>

                      {/* Broadband Bill status */}
                      <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px' }}>
                        <h4 style={{ fontSize: '0.75rem', color: '#818CF8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FastNet Broadband Bill (ইন্টারনেট বিল)</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>Monthly Bill:</span>
                          <span style={{ textDecoration: discountApplied > 0 ? 'line-through' : 'none' }}>₹499.00</span>
                        </div>
                        {discountApplied > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent)' }}>
                            <span>Loyalty Subsidy Applied:</span>
                            <span>-₹{discountApplied.toFixed(2)}</span>
                          </div>
                        )}
                        <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '0.4rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>
                          <span>Outstanding Bill Amount:</span>
                          <span style={{ color: discountApplied >= 499 ? 'var(--accent)' : 'white' }}>
                            ₹{Math.max(0, 499 - discountApplied).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Redeem Input */}
                      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Redeem Broadband Subsidy (বিল ডিসকাউন্ট করুন)</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="number" 
                            placeholder="Enter points to redeem" 
                            className="text-input" 
                            value={redeemAmount}
                            onChange={e => setRedeemAmount(e.target.value)}
                            style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          />
                          <button className="btn btn-accent" onClick={handleRedeemPoints} style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}>
                            Redeem
                          </button>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>Discount History (ডিসকাউন্ট লগ)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {customerLedger.map(l => (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: 'white' }}>{l.description}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{new Date(l.created_at).toLocaleDateString()}</div>
                            </div>
                            <div style={{ fontWeight: 'bold', color: l.type === 'EARN' ? 'var(--accent)' : 'var(--danger)', fontSize: '0.8rem' }}>
                              {l.amount > 0 ? `+${l.amount} pts` : `-${Math.abs(l.amount)} pts`}
                            </div>
                          </div>
                        ))}
                        {customerLedger.length === 0 && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center' }}>No transactions recorded.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {customerAppTab === 'pointshop' && (() => {
                    const redeemItem = async (cost, type, label) => {
                      if (customerBalance < cost) { showToast(`Need ${cost} pts — you have ${customerBalance.toFixed(1)}`, 'error'); return; }
                      try {
                        const res = await fetch(`${API_BASE}/ledger/redeem`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ customerId: currentUser.id, amount: cost, redemptionType: type })
                        });
                        if (res.ok) { showToast(`✅ ${label} redeemed!`); loadCustomerData(); }
                        else { const d = await res.json(); showToast(d.error || 'Redemption failed', 'error'); }
                      } catch (e) { showToast('Redemption error', 'error'); }
                    };

                    const shopItems = [
                      {
                        category: '📡 Broadband & WiFi',
                        color: '#6366f1',
                        items: [
                          { label: 'Bill Discount — ₹50 off', sub: 'Instantly off your next monthly broadband bill', pts: 50, type: 'BROADBAND_DISCOUNT_50', emoji: '💸' },
                          { label: 'Bill Discount — ₹100 off', sub: 'For power users. Cuts bill by ₹100 this month', pts: 100, type: 'BROADBAND_DISCOUNT_100', emoji: '💳' },
                          { label: 'Speed Booster 48h (100 Mbps)', sub: '2 days of priority bandwidth. No throttling.', pts: 150, type: 'WIFI_TOPUP', emoji: '⚡' },
                          { label: 'Data Top-up 10 GB', sub: 'Extra 10 GB added to your plan instantly', pts: 80, type: 'DATA_TOPUP', emoji: '📶' },
                        ]
                      },
                      {
                        category: '📺 Cable TV',
                        color: '#ec4899',
                        items: [
                          { label: 'Basic Pack — 1 Month Free', sub: '30 days of regional & local channels', pts: 100, type: 'CABLE_RECHARGE', emoji: '📺' },
                          { label: 'HD Premium Pack — 1 Month', sub: 'Sports, Movies, News HD channels', pts: 250, type: 'CABLE_RECHARGE', emoji: '🎬' },
                          { label: 'Kids & Family Bundle', sub: 'Cartoon Network, Pogo & family channels', pts: 120, type: 'CABLE_RECHARGE', emoji: '👨‍👩‍👧' },
                        ]
                      },
                    ];

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Header Hero */}
                        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(236,72,153,0.15) 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '14px', padding: '1rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Your Balance</div>
                          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>{customerBalance.toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>pts</span></div>
                          <div style={{ fontSize: '0.6rem', color: '#818cf8', marginTop: '0.35rem' }}>Redeemable across FastNet broadband, wifi, and cable TV plans</div>
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
                                    <div style={{ fontSize: '1.4rem', flexShrink: 0, width: '32px', textAlign: 'center' }}>{item.emoji}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'white', lineHeight: 1.2 }}>{item.label}</div>
                                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.sub}</div>
                                      <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: cat.color, marginTop: '0.2rem' }}>{item.pts} pts</div>
                                    </div>
                                    <button
                                      id={`redeem-${item.type}`}
                                      disabled={!canAfford}
                                      onClick={() => redeemItem(item.pts, item.type, item.label)}
                                      style={{ flexShrink: 0, padding: '0.35rem 0.6rem', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed', background: canAfford ? cat.color : 'rgba(255,255,255,0.1)', color: canAfford ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}
                                    >
                                      Redeem
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
                      <h3 style={{ fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>My Orders (আমার অর্ডার)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {customerOrders.map(o => {
                          const isPrepElapsed = prepElapsedOrders.includes(o.id);
                          return (
                            <div key={o.id} className="glass-card" style={{ padding: '0.65rem', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 'bold' }}>Order #{o.id.substring(2).toUpperCase()}</span>
                                <span key={o.status} className={`badge ${o.status === 'DELIVERED' ? 'badge-success' : 'badge-warning'} status-badge-glow`}>{o.status}</span>
                              </div>
                              <div style={{ color: 'var(--text-muted)' }}>Store: {o.stockist_name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>
                                Delivery Mode: {o.fulfillment_type === 'DELIVERY' ? '🚚 DELIVERY' : ` Take Away (Pickup slot: ${o.pickup_slot || 'Pending slot selection'})`}
                              </div>

                              {/* Active slot picker inside orders list if pickup is chosen and slots are pending */}
                              {o.status !== 'DELIVERED' && o.fulfillment_type === 'PICKUP' && (
                                <div style={{ border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '0.5rem', marginTop: '0.25rem', background: 'rgba(255,255,255,0.01)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Time Slot Select:</span>
                                    {!isPrepElapsed && (
                                      <button 
                                        className="btn btn-secondary" 
                                        style={{ padding: '0.1rem 0.3rem', fontSize: '0.55rem' }}
                                        onClick={() => setPrepElapsedOrders(prev => [...prev, o.id])}
                                      >
                                        Simulate Prep Time Elapsed
                                      </button>
                                    )}
                                  </div>
                                  <select 
                                    className="text-input" 
                                    style={{ fontSize: '0.65rem', padding: '0.2rem' }}
                                    disabled={!isPrepElapsed}
                                    value={o.pickup_slot || ''}
                                    onChange={e => handleSavePickupSlot(o.id, e.target.value)}
                                  >
                                    <option value="">-- Choose Pickup Slot --</option>
                                    <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
                                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                                    <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                                  </select>
                                </div>
                              )}

                              {o.fulfillment_type === 'PICKUP' && o.status !== 'DELIVERED' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.3rem', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.05)', fontSize: '0.65rem' }}>
                                  🔑 Pickup PIN (পিকআপ কোড): <strong style={{ color: 'var(--primary-glow)', letterSpacing: '0.05em' }}>{o.pickup_pin || '1234'}</strong>
                                </div>
                              )}

                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                                <span>Paid: ₹{o.total_price.toFixed(2)}</span>
                                
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                  <button 
                                    className="badge badge-primary" 
                                    style={{ border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem', fontSize: '0.6rem' }}
                                    onClick={() => handleReorder(o)}
                                  >
                                    🔁 Reorder
                                  </button>

                                  <button 
                                    className="badge badge-success" 
                                    style={{ border: 'none', cursor: 'pointer', background: 'rgba(37,211,102,0.1)', color: '#25D366', padding: '0.2rem 0.4rem', fontSize: '0.6rem' }}
                                    onClick={() => {
                                      const waMsg = `Hi! FastNet Supermarket order #${o.id.substring(2).toUpperCase()} status is ${o.status}. Total: ₹${o.total_price}. Pickup PIN: ${o.pickup_pin || 'N/A'}.`;
                                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`, '_blank');
                                    }}
                                  >
                                    💬 Share
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
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {customerOrders.length === 0 && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center' }}>No orders placed yet.</p>
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
                    Shop
                  </button>
                  <button className={`phone-nav-btn ${customerAppTab === 'ledger' ? 'active' : ''}`} onClick={() => setCustomerAppTab('ledger')}>
                    <Sparkles size={18} />
                    Points
                  </button>
                  <button id="nav-pointshop" className={`phone-nav-btn ${customerAppTab === 'pointshop' ? 'active' : ''}`} onClick={() => setCustomerAppTab('pointshop')} style={{ position: 'relative' }}>
                    <Gift size={18} />
                    Rewards
                    {customerBalance > 0 && <span style={{ position: 'absolute', top: '4px', right: '6px', background: 'var(--accent)', color: 'black', fontSize: '0.45rem', fontWeight: 'bold', borderRadius: '99px', padding: '1px 4px', lineHeight: 1.2 }}>{Math.floor(customerBalance)}</span>}
                  </button>
                  <button className={`phone-nav-btn ${customerAppTab === 'orders' ? 'active' : ''}`} onClick={() => setCustomerAppTab('orders')}>
                    <ArrowRightLeft size={18} />
                    Orders
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

    const renderOrderProgressBar = (status) => {
      const steps = [
        { key: 'PENDING', label: 'Received' },
        { key: 'ACCEPTED', label: 'Accepted' },
        { key: 'PREPARING', label: 'Packing' },
        { key: 'SHIPPED', label: 'On Way' },
        { key: 'DELIVERED', label: 'Completed' }
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
          <span>🏪 SHOPKEEPER VIEW (দোকানদার মোড): {isLoggedOut ? "Not logged in (লগইন করা নেই)" : `${stockistProfile?.name || currentUser.name} (${activeRegionName})`}</span>
        </div>

        <div className="phone-mockup">
          <div className="phone-notch"></div>
          <div className="phone-screen">
            {isLoggedOut ? (
              <>
                <div className="phone-header">
                  <span>FastNet 5G</span>
                  <span>📶 🔋 19:43</span>
                </div>
                {renderAuthForm()}
              </>
            ) : !stockistProfile ? (
              <>
                <div className="phone-header">
                  <span>FastNet 5G</span>
                  <span>📶 🔋 19:43</span>
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
                    {offlineMode ? 'Offline (অফলাইন)' : 'Online (অনলাইন)'}
                  </span>
                </div>

                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  
                  {/* Today's Earnings Summary Widget */}
                  <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-glow) 100%)', borderRadius: '12px', padding: '0.85rem 1rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '0.15rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>🏪 Today's Total Earnings (আজকের আয়)</span>
                    <span style={{ fontSize: '1.7rem', fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>
                      ₹{todaysEarnings.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.75)' }}>Instant wholesale settlement share credited to bank</span>
                  </div>

                  {/* Sync bar if offline queue has items */}
                  {offlineQueue.length > 0 && (
                    <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', borderRadius: '6px', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span><strong>{offlineQueue.length}</strong> updates pending sync</span>
                      {!offlineMode && (
                        <button className="badge badge-warning" style={{ border: 'none', cursor: 'pointer' }} onClick={handleSyncOfflineQueue}>
                          Sync Now
                        </button>
                      )}
                    </div>
                  )}

                  {/* Offline toggle control */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.8rem', color: 'white' }}>Signal Simulator (নেটওয়ার্ক সিগন্যাল)</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Test offline rural store state</p>
                    </div>
                    <button 
                      onClick={toggleOfflineMode} 
                      className={`badge ${offlineMode ? 'badge-danger' : 'badge-success'}`}
                      style={{ border: 'none', cursor: 'pointer', padding: '0.4rem 0.6rem', textTransform: 'uppercase' }}
                    >
                      {offlineMode ? 'Connect' : 'Disconnect'}
                    </button>
                  </div>

                  {/* Active Orders Queue */}
                  <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>New Orders (নতুন অর্ডার)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {stockistOrders.map(o => {
                      const isNew = o.status === 'PENDING';
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
                                  NEW INCOMING (নতুন অর্ডার)
                                </span>
                              )}
                              <span className={`badge ${o.status === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                                {o.status}
                              </span>
                            </div>
                          </div>

                          {/* Basic Customer Context */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.45rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.75rem' }}>👤 {o.customer_name}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>📍 {o.region_id === 'r2' ? 'Bishnupur Rural' : 'Garia Urban'}</span>
                            </div>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>📞 Phone: {o.customer_phone || 'N/A'}</span>
                          </div>

                          {/* Visual Step Progress Bar */}
                          {renderOrderProgressBar(o.status)}

                          {/* Order Items List */}
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.4rem 0.5rem', borderRadius: '4px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem' }}>ITEMS TO PACK:</div>
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
                              <span style={{ color: 'var(--accent)' }}>🏪 Payout to You:</span>
                              <span style={{ color: 'var(--accent)' }}>₹{parseFloat(o.stockist_amount || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              <span>⚙️ FastNet Commission:</span>
                              <span>₹{parseFloat(o.platform_amount || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0 0.1rem' }}>
                            <span>Basket Subtotal: ₹{o.subtotal}</span>
                            <span>Total Price: ₹{o.total_price}</span>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {o.status === 'PENDING' && (
                                <button className="btn" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'ACCEPTED')}>
                                  Accept (স্বীকার করুন)
                                </button>
                              )}
                              {o.status === 'ACCEPTED' && (
                                <button className="btn btn-accent" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'PREPARING')}>
                                  Prepare (প্যাক করুন)
                                </button>
                              )}
                              {o.status === 'PREPARING' && (
                                <button className="btn btn-accent" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'SHIPPED')}>
                                  {o.fulfillment_type === 'PICKUP' ? 'Mark Ready for Pickup' : 'Deliver (ডেলিভারি করুন)'}
                                </button>
                              )}
                              {o.status === 'SHIPPED' && (
                                o.fulfillment_type === 'PICKUP' ? (
                                  <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                                    <input 
                                      type="text" 
                                      placeholder="Enter Customer PIN" 
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
                                      Verify PIN
                                    </button>
                                  </div>
                                ) : (
                                  <button className="btn" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.7rem', background: 'var(--accent)' }} onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}>
                                    Complete & Pay (ডেলিভারি সম্পন্ন)
                                  </button>
                                )
                              )}
                              {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                                <button className="btn btn-danger" style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'CANCELLED')}>Cancel</button>
                              )}
                            </div>
                            
                            {o.status === 'DELIVERED' && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ width: '100%', padding: '0.25rem 0', fontSize: '0.65rem', background: 'rgba(245,158,11,0.06)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' }}
                                onClick={() => {
                                  setSubmittingFeedbackOrder(o);
                                  setFeedbackRating(5);
                                  setFeedbackReason('');
                                }}
                              >
                                ★ Report / Rate Customer (ক্রেতার ফিডব্যাক)
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

                  {/* Inventory Restock Panel */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Store Inventory (স্টক তালিকা)</h3>
                    <button 
                      className="btn btn-accent" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }} 
                      onClick={() => setShowAddProductModal(true)}
                    >
                      + Add New SKU
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>⚠️ Low Stock Warning Threshold:</span>
                    <input 
                      type="number" 
                      min="0" 
                      style={{ width: '45px', padding: '0.2rem', fontSize: '0.7rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center' }}
                      value={lowStockThreshold}
                      onChange={e => setLowStockThreshold(e.target.value)}
                    />
                  </div>
                  
                  <div className="input-group" style={{ marginTop: '0.5rem' }}>
                    <label className="input-label" style={{ fontSize: '0.65rem' }}>Select Wholesaler (পাইকারি বিক্রেতা)</label>
                    <select 
                      className="text-input" 
                      value={selectedRestockVendorId} 
                      onChange={e => setSelectedRestockVendorId(e.target.value)}
                      style={{ background: 'var(--bg-surface)', fontSize: '0.7rem', padding: '0.25rem' }}
                    >
                      {stockistApprovedVendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                      {stockistApprovedVendors.length === 0 && (
                        <option value="">No Approved Wholesalers</option>
                      )}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {stockistProducts.map(p => {
                      const isLowStock = p.stock_qty < parseInt(lowStockThreshold || '15', 10);
                      return (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: isLowStock ? '1px dashed var(--warning)' : '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: 'white' }}>{p.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                              Stock qty: <strong style={{ color: p.stock_qty > 0 ? 'var(--accent)' : 'var(--danger)' }}>{p.stock_qty}</strong>
                              {isLowStock && (
                                <span style={{ color: 'var(--warning)', marginLeft: '0.4rem', fontWeight: 'bold' }}>⚠️ Low Stock</span>
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
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={() => handlePurchaseStock(p.id, restockQuantities[p.id] || 20, selectedRestockVendorId)}
                          >
                            Buy Stock
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>

                  <button className="btn btn-danger" style={{ width: '100%', marginTop: 'auto', fontSize: '0.8rem' }} onClick={handleLogout}>Log Out</button>

                  {showAddProductModal && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '1.25rem', justifyContent: 'center' }}>
                      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>Add New SKU (নতুন পণ্য তৈরি)</h3>
                        
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.65rem' }}>Product Name *</label>
                          <input type="text" className="text-input" placeholder="e.g. Fresh Potatoes 1kg" value={newProdName} onChange={e => setNewProdName(e.target.value)} style={{ fontSize: '0.75rem', padding: '0.3rem' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.65rem' }}>Selling Price (₹) *</label>
                            <input type="number" className="text-input" placeholder="30" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} style={{ fontSize: '0.75rem', padding: '0.3rem' }} />
                          </div>
                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.65rem' }}>Wholesale Cost (₹)</label>
                            <input type="number" className="text-input" placeholder="22" value={newProdCostPrice} onChange={e => setNewProdCostPrice(e.target.value)} style={{ fontSize: '0.75rem', padding: '0.3rem' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.65rem' }}>Category</label>
                            <select className="text-input" value={newProdCategory} onChange={e => setNewProdCategory(e.target.value)} style={{ fontSize: '0.75rem', padding: '0.3rem', background: 'var(--bg-surface)' }}>
                              <option value="groceries">Groceries</option>
                              <option value="packaged_foods">Packaged Foods</option>
                              <option value="dairy">Dairy</option>
                            </select>
                          </div>
                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.65rem' }}>Initial Stock *</label>
                            <input type="number" min="0" className="text-input" value={newProdInitialStock} onChange={e => setNewProdInitialStock(e.target.value)} style={{ fontSize: '0.75rem', padding: '0.3rem' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button className="btn btn-accent" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }} onClick={handleAddNewProduct}>
                            Save SKU
                          </button>
                          <button className="btn btn-secondary" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }} onClick={() => setShowAddProductModal(false)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {submittingFeedbackOrder && submittingFeedbackOrder.stockist_id === stockistProfile.id && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '1.25rem', justifyContent: 'center' }}>
                      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>Report Customer (ক্রেতার ফিডব্যাক)</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', margin: 0 }}>Rate buyer behavior for {submittingFeedbackOrder.customer_name}</p>
                        
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
                          <label className="input-label" style={{ fontSize: '0.65rem' }}>Details / Incident Reason</label>
                          <textarea 
                            className="text-input" 
                            style={{ height: '60px', fontSize: '0.75rem', padding: '0.3rem' }} 
                            placeholder="e.g. Prompt collector, highly cooperative"
                            value={feedbackReason}
                            onChange={e => setFeedbackReason(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button className="btn btn-accent" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }} onClick={() => handleSaveFeedback('STOCKIST')}>
                            Submit
                          </button>
                          <button className="btn btn-secondary" style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }} onClick={() => setSubmittingFeedbackOrder(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        <div className="perspective-banner">
          <span>⚙️ OPERATOR PORTAL (অ্যাডমিন মোড): FastNet Broadband Operations Dashboard</span>
        </div>

        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h1>Operator Admin Dashboard</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>FastNet Broadband Pilot Tenant Operations</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-danger" onClick={handleResetDb} style={{ fontSize: '0.8rem' }}>
                <RotateCcw size={14} /> Reset Database (রিসেট করুন)
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
                <ArrowRightLeft size={16} /> Broadband Discounts ({pendingRedemptions.filter(r=>r.billing_sync_status==='PENDING').length})
              </button>
              <button className={`admin-nav-item ${adminTab === 'vendors' ? 'active' : ''}`} onClick={() => setAdminTab('vendors')}>
                <ShoppingBag size={16} /> Wholesalers ({vendors.length})
              </button>
              <button className={`admin-nav-item ${adminTab === 'transactions' ? 'active' : ''}`} onClick={() => setAdminTab('transactions')}>
                <ArrowRightLeft size={16} /> All Transactions
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
                              Approve Shop (অনুমোদন করুন)
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
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>ISP Commission & Customer Points Config (কমিশন ও পয়েন্ট নীতি)</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Set regional percentage charges or override rates per shop, and independently configure customer point earn rates.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* LEFT COLUMN: COMMISSION SETUP */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4>Configure Regional Commission</h4>
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
                        <h4>Configure Shop Commission Override (§9)</h4>
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
                        <h4>Configure Customer Points Earn Rate (§10)</h4>
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
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Feedback & Incident Queue (§11)</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    View service ratings, wrong items, no-shows, or customer behavioral reports filed by user roles.
                  </p>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reporter</th>
                        <th>Target Role</th>
                        <th>Target Name</th>
                        <th>Order ID</th>
                        <th>Rating</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allFeedbackReports.map(fb => (
                        <tr key={fb.id}>
                          <td>{new Date(fb.created_at).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 'bold' }}>{fb.reporter_name} ({fb.reporter_role})</td>
                          <td>{fb.target_role}</td>
                          <td>{fb.target_name}</td>
                          <td style={{ fontFamily: 'monospace' }}>#{fb.order_id.substring(2).toUpperCase()}</td>
                          <td>
                            <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>
                              {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                            </span>
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
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Suspicious Activity Flags (তদন্তের অর্ডার)</h2>
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
                            {an.status === 'FLAGGED' ? (
                              <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.75rem' }}>⚠️ Flagged for Investigation</span>
                            ) : (
                              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleFlagAnomaly(an.id)}>
                                Flag for Review (তদন্ত করুন)
                              </button>
                            )}
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
                      <h2 style={{ fontSize: '1.4rem' }}>Subscriber Broadband Discounts (ব্রডব্যান্ড ডিসকাউন্ট)</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Approve and synchronize redeemed bill discounts with FastNet CRM billing software.
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
                          <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{Math.abs(r.amount)} pts</td>
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
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Approved Wholesalers List (পাইকারি বিক্রেতা)</h2>
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
                        <h4>Approve Wholesaler for Store (§12)</h4>
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
                  <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>All Marketplace Transactions (§13)</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Full visibility into orders, split commissions, and points generated across Garia & Bishnupur regions.
                  </p>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Store</th>
                        <th>Total Amount</th>
                        <th>Subtotal</th>
                        <th>Delivery Fee</th>
                        <th>Shop Share</th>
                        <th>ISP Share</th>
                        <th>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbState?.orders?.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontFamily: 'monospace' }}>#{o.id.substring(2).toUpperCase()}</td>
                          <td>{o.stockist_name}</td>
                          <td style={{ fontWeight: 'bold' }}>₹{o.total_price.toFixed(2)}</td>
                          <td>₹{o.subtotal.toFixed(2)}</td>
                          <td>₹{o.delivery_fee.toFixed(2)}</td>
                          <td style={{ color: 'var(--accent)' }}>₹{(o.stockist_amount || 0).toFixed(2)}</td>
                          <td style={{ color: 'var(--primary)' }}>₹{(o.platform_amount || 0).toFixed(2)}</td>
                          <td>{(o.points_credited || 0)} pts</td>
                        </tr>
                      ))}
                      {(!dbState?.orders || dbState.orders.length === 0) && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No transactions recorded.
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
