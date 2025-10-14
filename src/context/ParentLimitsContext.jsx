import React, { createContext, useContext, useReducer, useEffect } from 'react';
import parentLimitsData from '../data/parentLimits.json';

const ParentLimitsContext = createContext();

const initialState = {
  spendingLimits: parentLimitsData.spendingLimits,
  operationPermissions: parentLimitsData.operationPermissions,
  categoryRestrictions: parentLimitsData.categoryRestrictions,
  whitelist: parentLimitsData.whitelist,
  approvalRequired: parentLimitsData.approvalRequired
};

const parentLimitsReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_SPENDING_LIMITS':
      return {
        ...state,
        spendingLimits: { ...state.spendingLimits, ...action.payload }
      };
    
    case 'UPDATE_OPERATION_PERMISSIONS':
      return {
        ...state,
        operationPermissions: { ...state.operationPermissions, ...action.payload }
      };
    
    case 'UPDATE_CATEGORY_RESTRICTIONS':
      return {
        ...state,
        categoryRestrictions: { ...state.categoryRestrictions, ...action.payload }
      };
    
    case 'UPDATE_WHITELIST':
      return {
        ...state,
        whitelist: { ...state.whitelist, ...action.payload }
      };
    
    case 'ADD_WHITELIST_MERCHANT':
      return {
        ...state,
        whitelist: {
          ...state.whitelist,
          merchants: [...state.whitelist.merchants, action.payload]
        }
      };
    
    case 'REMOVE_WHITELIST_MERCHANT':
      return {
        ...state,
        whitelist: {
          ...state.whitelist,
          merchants: state.whitelist.merchants.filter(m => m.id !== action.payload)
        }
      };
    
    case 'ADD_PENDING_APPROVAL':
      return {
        ...state,
        approvalRequired: {
          ...state.approvalRequired,
          pendingApprovals: [...state.approvalRequired.pendingApprovals, action.payload]
        }
      };
    
    case 'APPROVE_PURCHASE':
      return {
        ...state,
        approvalRequired: {
          ...state.approvalRequired,
          pendingApprovals: state.approvalRequired.pendingApprovals.filter(
            approval => approval.id !== action.payload
          )
        }
      };
    
    case 'REJECT_PURCHASE':
      return {
        ...state,
        approvalRequired: {
          ...state.approvalRequired,
          pendingApprovals: state.approvalRequired.pendingApprovals.filter(
            approval => approval.id !== action.payload
          )
        }
      };
    
    case 'LOAD_LIMITS':
      return { ...action.payload };
    
    default:
      return state;
  }
};

export const ParentLimitsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(parentLimitsReducer, initialState);

  // Загрузка из localStorage
  useEffect(() => {
    const savedLimits = localStorage.getItem('parentLimits');
    if (savedLimits) {
      try {
        const parsedLimits = JSON.parse(savedLimits);
        dispatch({ type: 'LOAD_LIMITS', payload: parsedLimits });
      } catch (error) {
        console.error('Ошибка загрузки лимитов:', error);
      }
    }
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    localStorage.setItem('parentLimits', JSON.stringify(state));
  }, [state]);

  const updateSpendingLimits = (limits) => {
    dispatch({ type: 'UPDATE_SPENDING_LIMITS', payload: limits });
  };

  const updateOperationPermissions = (permissions) => {
    dispatch({ type: 'UPDATE_OPERATION_PERMISSIONS', payload: permissions });
  };

  const updateCategoryRestrictions = (restrictions) => {
    dispatch({ type: 'UPDATE_CATEGORY_RESTRICTIONS', payload: restrictions });
  };

  const updateWhitelist = (whitelist) => {
    dispatch({ type: 'UPDATE_WHITELIST', payload: whitelist });
  };

  const addWhitelistMerchant = (merchant) => {
    dispatch({ type: 'ADD_WHITELIST_MERCHANT', payload: merchant });
  };

  const removeWhitelistMerchant = (merchantId) => {
    dispatch({ type: 'REMOVE_WHITELIST_MERCHANT', payload: merchantId });
  };

  const addPendingApproval = (approval) => {
    dispatch({ type: 'ADD_PENDING_APPROVAL', payload: approval });
  };

  const approvePurchase = (approvalId) => {
    dispatch({ type: 'APPROVE_PURCHASE', payload: approvalId });
  };

  const rejectPurchase = (approvalId) => {
    dispatch({ type: 'REJECT_PURCHASE', payload: approvalId });
  };

  const checkSpendingLimit = (amount) => {
    const { dailyLimit, weeklyLimit, singlePurchaseLimit, enabled } = state.spendingLimits;
    
    if (!enabled) return { allowed: true };
    
    if (amount > singlePurchaseLimit) {
      return { 
        allowed: false, 
        reason: 'single_purchase_limit',
        limit: singlePurchaseLimit 
      };
    }
    
    // Здесь можно добавить проверку дневных и недельных лимитов
    // Для этого нужно будет интегрироваться с системой трат
    
    return { allowed: true };
  };

  const checkCategoryAllowed = (category) => {
    const { blockedCategories, allowedCategories } = state.categoryRestrictions;
    
    if (blockedCategories.includes(category)) {
      return { allowed: false, reason: 'blocked_category' };
    }
    
    if (allowedCategories.length > 0 && !allowedCategories.includes(category)) {
      return { allowed: false, reason: 'not_allowed_category' };
    }
    
    return { allowed: true };
  };

  const checkMerchantWhitelist = (merchantName) => {
    const { enabled, merchants } = state.whitelist;
    
    if (!enabled) return { allowed: true };
    
    const isWhitelisted = merchants.some(merchant => 
      merchant.name.toLowerCase().includes(merchantName.toLowerCase())
    );
    
    return { allowed: isWhitelisted };
  };

  const value = {
    ...state,
    updateSpendingLimits,
    updateOperationPermissions,
    updateCategoryRestrictions,
    updateWhitelist,
    addWhitelistMerchant,
    removeWhitelistMerchant,
    addPendingApproval,
    approvePurchase,
    rejectPurchase,
    checkSpendingLimit,
    checkCategoryAllowed,
    checkMerchantWhitelist
  };

  return (
    <ParentLimitsContext.Provider value={value}>
      {children}
    </ParentLimitsContext.Provider>
  );
};

export const useParentLimits = () => {
  const context = useContext(ParentLimitsContext);
  if (!context) {
    throw new Error('useParentLimits must be used within a ParentLimitsProvider');
  }
  return context;
};


