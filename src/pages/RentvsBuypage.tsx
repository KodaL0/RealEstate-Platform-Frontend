import React, { useState, useEffect } from 'react';
import { Calculator, Home, TrendingUp, Info, RefreshCw, ChevronDown, ChevronUp, DollarSign, PieChart } from 'lucide-react';

const sanitize = (val: number | string | null): number => {
  if (val === null) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(val.toString().replace(/,/g, '')) || 0;
};

const RentVsBuyPage: React.FC = () => {
  // Main inputs - using numbers for better performance and validation
  const [propertyPrice, setPropertyPrice] = useState<number | null>(null);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number | null>(null);
  const [interestRate, setInterestRate] = useState<number | null>(null);
  const [loanTermYears, setLoanTermYears] = useState<number | null>(null);
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);
  const [rentGrowthRate, setRentGrowthRate] = useState<number | null>(null);
  const [stayDuration, setStayDuration] = useState<number | null>(null);

  // Investment assumptions
  const [investmentReturnRate, setInvestmentReturnRate] = useState<number>(6);
  const [reinvestMonthlyDiff, setReinvestMonthlyDiff] = useState<boolean>(true);
  
  // Advanced settings (exposed magic numbers)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [maintenanceRate, setMaintenanceRate] = useState<number>(1); // 1% annually
  const [propertyTaxRate, setPropertyTaxRate] = useState<number>(0.2); // 0.2% annually  
  const [appreciationRate, setAppreciationRate] = useState<number>(3); // 3% annually
  const [closingCostRate, setClosingCostRate] = useState<number>(3); // 3% closing costs
  const [sellingCostRate, setSellingCostRate] = useState<number>(2); // 2% selling costs
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Results
  const [buyCost, setBuyCost] = useState<number | null>(null);
  const [rentCost, setRentCost] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Initial calculation on mount
  useEffect(() => {
    calculateComparison();
  }, []); // Empty dependency array - run once on mount

  // Recompute whenever any input changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateComparison();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [propertyPrice, downPaymentPercent, interestRate, loanTermYears, monthlyRent, rentGrowthRate, stayDuration, investmentReturnRate, reinvestMonthlyDiff, maintenanceRate, propertyTaxRate, appreciationRate, closingCostRate, sellingCostRate]);

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};
    
    // Basic validation
    if (propertyPrice <= 0) newErrors.propertyPrice = 'Property price must be greater than 0';
    if (monthlyRent <= 0) newErrors.monthlyRent = 'Monthly rent must be greater than 0';
    if (stayDuration <= 0) newErrors.stayDuration = 'Stay duration must be greater than 0';
    if (downPaymentPercent < 0 || downPaymentPercent > 100) newErrors.downPaymentPercent = 'Down payment must be 0-100%';
    if (interestRate < 0 || interestRate > 50) newErrors.interestRate = 'Interest rate must be 0-50%';
    if (loanTermYears <= 0 || loanTermYears > 50) newErrors.loanTermYears = 'Loan term must be 1-50 years';
    if (investmentReturnRate < 0 || investmentReturnRate > 15) newErrors.investmentReturnRate = 'Investment return must be 0-15%';
    
    // Sanity checks for realistic values
    const annualRent = monthlyRent * 12;
    const rentToValueRatio = (annualRent / propertyPrice) * 100;
    
    if (rentToValueRatio > 25) {
      newErrors.monthlyRent = `Monthly rent seems too high (${rentToValueRatio.toFixed(1)}% of property value annually). Typical range: 4-8%`;
    }
    
    if (rentToValueRatio < 1 && monthlyRent > 0 && propertyPrice > 0) {
      newErrors.monthlyRent = `Monthly rent seems too low (${rentToValueRatio.toFixed(1)}% of property value annually). Typical range: 4-8%`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateComparison = () => {
    setIsCalculating(true);
    
    if (!validateInputs()) {
      setBuyCost(null);
      setRentCost(null);
      setRecommendation('Please fix the errors above to see results.');
      setIsCalculating(false);
      return;
    }

    // Calculate buy costs (proper amortization method)
    const downPayment = propertyPrice * (downPaymentPercent / 100);
    const loanAmount = propertyPrice - downPayment;
    const monthlyInterestRate = interestRate / 100 / 12;
    const totalLoanPayments = loanTermYears * 12;
    const stayPayments = Math.min(stayDuration * 12, totalLoanPayments);

    let monthlyPayment = 0;
    let totalInterestPaid = 0;
    let remainingBalance = loanAmount;

    if (monthlyInterestRate > 0 && loanTermYears > 0) {
      // Calculate monthly payment using standard amortization formula
      monthlyPayment = loanAmount * monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -totalLoanPayments));
      
      // Calculate interest paid and remaining balance after stay period
      let balance = loanAmount;
      
      for (let month = 1; month <= stayPayments; month++) {
        const interestPayment = balance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        totalInterestPaid += interestPayment;
        balance -= principalPayment;
      }
      
      remainingBalance = Math.max(0, balance);
    } else {
      // Zero interest case - simple division
      const principalPaid = Math.min(loanAmount, (loanAmount / totalLoanPayments) * stayPayments);
      remainingBalance = loanAmount - principalPaid;
      monthlyPayment = loanAmount / totalLoanPayments;
      totalInterestPaid = 0;
    }

    // Other ownership costs
    const maintenance = propertyPrice * (maintenanceRate / 100) * stayDuration;
    const propertyTax = propertyPrice * (propertyTaxRate / 100) * stayDuration;
    const closingCosts = propertyPrice * (closingCostRate / 100);
    
    // Property appreciation and sale
    const futureValue = propertyPrice * Math.pow(1 + appreciationRate / 100, stayDuration);
    const sellingCosts = futureValue * (sellingCostRate / 100);
    
    // Net proceeds from sale (what you actually receive)
    const netSaleProceeds = futureValue - sellingCosts - remainingBalance;
    
    // Total cash outflows during ownership
    const totalCashOut = downPayment + totalInterestPaid + maintenance + propertyTax + closingCosts;
    
    // Net position before opportunity cost (negative = you're ahead)
    const netGainBeforeOppCost = netSaleProceeds - totalCashOut;

    // Calculate rent cost with growth
    let rentTotal = 0;
    let currentRent = monthlyRent;
    const rentGrowthRateDecimal = rentGrowthRate / 100;
    
    for (let year = 0; year < stayDuration; year++) {
      rentTotal += currentRent * 12;
      currentRent *= (1 + rentGrowthRateDecimal);
    }

    // Investment opportunity cost calculations
    const r = Math.max(0, Math.min(15, investmentReturnRate)) / 100;
    const monthlyR = r / 12;

    // 1. Opportunity cost for buyer (what down payment could have earned if invested)
    const downPaymentOpportunityCost = downPayment * (Math.pow(1 + r, stayDuration) - 1);

    // 2. Potential gain for renter (investing monthly surplus)
    const surplus = Math.max(0, monthlyPayment - monthlyRent);
    let surplusInvestmentGain = 0;
    
    if (surplus > 0 && reinvestMonthlyDiff) {
      if (r === 0) {
        // No investment return - just save the surplus
        surplusInvestmentGain = surplus * 12 * stayDuration;
      } else {
        // Future value of monthly annuity
        surplusInvestmentGain = surplus * ((Math.pow(1 + monthlyR, stayDuration * 12) - 1) / monthlyR);
      }
    }

    // Final totals including opportunity costs
    const effectiveBuyCost = downPaymentOpportunityCost - netGainBeforeOppCost;
    const effectiveRentCost = rentTotal - surplusInvestmentGain;

    setBuyCost(effectiveBuyCost);
    setRentCost(effectiveRentCost);
    
    const savings = Math.abs(effectiveBuyCost - effectiveRentCost);
    if (effectiveBuyCost < effectiveRentCost) {
      setRecommendation(`Buying (incl. opportunity cost) saves €${savings.toFixed(0)} over ${stayDuration} years`);
    } else {
      setRecommendation(`Renting (with invested surplus) saves €${savings.toFixed(0)} over ${stayDuration} years`);
    }
    
    setIsCalculating(false);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || isNaN(value)) return '--';
    return value.toLocaleString('el-CY', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const resetCalculator = () => {
    setPropertyPrice(300000);
    setDownPaymentPercent(20);
    setInterestRate(4.25);
    setLoanTermYears(25);
    setMonthlyRent(1000);
    setRentGrowthRate(2.5);
    setStayDuration(10);
    setInvestmentReturnRate(6);
    setReinvestMonthlyDiff(true);
    setMaintenanceRate(1);
    setPropertyTaxRate(0.2);
    setAppreciationRate(3);
    setClosingCostRate(3);
    setSellingCostRate(2);
    setShowAdvanced(false);
    setShowBreakdown(false);
    setErrors({});
    
    // Trigger recalculation after reset
    setTimeout(() => calculateComparison(), 0);
  };

  const renderInputField = (
    id: string,
    label: string,
    value: number | null,
    setter: (val: number | null) => void,
    placeholder: string,
    unit?: string,
    min = 0,
    max = Infinity,
    step = "0.01",
    tooltip?: string
  ) => {
    // Compute whether to show error only after user has input something
    const showError = Boolean(errors[id] && value !== null);
  
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {label}
          {tooltip && (
            <div className="group relative">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -top-2 left-6">
                {tooltip}
              </div>
            </div>
          )}
        </label>
        <div className="relative">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            step={step}
            value={value === null ? '' : value.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setter(val === '' ? null : sanitize(val));
            }}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              showError ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-describedby={unit ? `${id}-unit` : undefined}
            aria-invalid={showError ? 'true' : 'false'}
          />
          {unit && (
            <span id={`${id}-unit`} className="absolute right-3 top-2.5 text-gray-500 text-sm">
              {unit}
            </span>
          )}
        </div>
        {showError && (
          <p className="text-red-500 text-sm" role="alert">{errors[id]}</p>
        )}
      </div>
    );
  };


  const renderResultCard = (
    title: string,
    value: number | null,
    isWinner: boolean,
    subtitle?: string,
    icon?: React.ReactNode
  ) => (
    <div className={`p-4 rounded-lg transition-all duration-200 ${
      isCalculating ? 'bg-gray-50' : 
      isWinner ? 'bg-green-50 border-2 border-green-200 shadow-md' : 'bg-red-50 border-2 border-red-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium text-gray-700">{title}</p>
        </div>
        <div className="group relative">
          <Info className="h-3 w-3 text-gray-500 cursor-help" />
          <div className="invisible group-hover:visible absolute z-20 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -top-2 right-4">
            {subtitle || "Total cost including opportunity costs"}
          </div>
        </div>
      </div>
      <p className={`text-lg sm:text-xl md:text-2xl font-bold ${
        isCalculating ? 'text-gray-600' :
        isWinner ? 'text-green-600' : 'text-red-600'
      }`}>
        {isCalculating ? 'Calculating...' : formatCurrency(value)}
      </p>
      {subtitle && !isCalculating && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center items-center mb-4">
            <Calculator className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 mr-3" />
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Rent vs Buy Calculator</h1>
          </div>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Make informed housing decisions with accurate cost comparisons including opportunity costs
          </p>
        </div>

        {/* Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
          
          {/* Left Column: Input Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Property Details & Rental Info - Side by side on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Property Details */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center mb-4 sm:mb-6">
                  <Home className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Property Details</h2>
                </div>
                <div className="space-y-4">
                  {renderInputField('propertyPrice', 'Property Price', propertyPrice, setPropertyPrice, '300,000', '€', 0, Infinity, '1000')}
                  {renderInputField('downPaymentPercent', 'Down Payment', downPaymentPercent, setDownPaymentPercent, '20', '%', 0, 100, '0.1')}
                  {renderInputField('interestRate', 'Interest Rate', interestRate, setInterestRate, '4.25', '%', 0, 50, '0.01')}
                  {renderInputField('loanTermYears', 'Loan Term', loanTermYears, setLoanTermYears, '25', 'years', 1, 50, '1')}
                </div>
              </div>

              {/* Rental Information */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center mb-4 sm:mb-6">
                  <Home className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Rental Information</h2>
                </div>
                <div className="space-y-4">
                  {renderInputField('monthlyRent', 'Monthly Rent', monthlyRent, setMonthlyRent, '1,000', '€/month')}
                  {renderInputField('rentGrowthRate', 'Rent Growth Rate', rentGrowthRate, setRentGrowthRate, '2.5', '%/year', 0, 20, '0.1')}
                  {renderInputField('stayDuration', 'Stay Duration', stayDuration, setStayDuration, '10', 'years', 1, 50, '1')}
                </div>
              </div>
            </div>

            {/* Investment Assumptions */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center mb-4 sm:mb-6">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mr-2" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Investment Assumptions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {renderInputField('investmentReturnRate', 'Alt. Investment Return', investmentReturnRate, setInvestmentReturnRate, '6', '%', 0, 15, '0.1', 'Expected annual return if you invested the down payment and monthly surplus in alternative investments')}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={reinvestMonthlyDiff}
                      onChange={(e) => setReinvestMonthlyDiff(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Re-invest Monthly Surplus</span>
                  </label>
                  <p className="text-xs text-gray-500">If mortgage payment &gt; rent, invest the difference monthly</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            
            {/* Winner Announcement */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200 mb-4">
                <p className="text-base sm:text-lg font-bold text-yellow-800 text-center">
                  {isCalculating ? 'Calculating...' : `🏆 ${recommendation}`}
                </p>
              </div>
            </div>

            {/* Cost Comparison Cards */}
            <div className="space-y-4">
              {renderResultCard(
                'Net Cost of Buying',
                buyCost,
                !isCalculating && buyCost !== null && rentCost !== null && buyCost < rentCost,
                `Up-front: ${formatCurrency(propertyPrice * (downPaymentPercent / 100))}`,
                <DollarSign className="h-4 w-4 text-blue-600" />
              )}
              
              {renderResultCard(
                'Net Cost of Renting',
                rentCost,
                !isCalculating && buyCost !== null && rentCost !== null && rentCost < buyCost,
                `Monthly start: ${formatCurrency(monthlyRent)}`,
                <Home className="h-4 w-4 text-green-600" />
              )}
            </div>

            {/* Detailed Breakdown Toggle */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                aria-expanded={showBreakdown}
                aria-controls="detailed-breakdown"
              >
                <span className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Detailed Cost Breakdown
                </span>
                {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Section */}
        {showBreakdown && !isCalculating && (
          <div id="detailed-breakdown" className="mb-8 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Buying Breakdown */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-5 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-4 text-center flex items-center justify-center gap-2 text-sm sm:text-base">
                  🏠 Buying Cash Flows
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    {
                      label: "Down Payment",
                      value: propertyPrice * (downPaymentPercent / 100),
                      tooltip: `${downPaymentPercent}% of property price`,
                      type: "expense"
                    },
                    {
                      label: "Interest Paid",
                      value: (() => {
                        const downPayment = propertyPrice * (downPaymentPercent / 100);
                        const loanAmount = propertyPrice - downPayment;
                        const monthlyInterestRate = interestRate / 100 / 12;
                        const totalLoanPayments = loanTermYears * 12;
                        const stayPayments = Math.min(stayDuration * 12, totalLoanPayments);
                        let totalInterest = 0;
                        if (monthlyInterestRate > 0) {
                          const monthlyPayment = loanAmount * monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -totalLoanPayments));
                          let balance = loanAmount;
                          for (let month = 1; month <= stayPayments; month++) {
                            totalInterest += balance * monthlyInterestRate;
                            balance -= (monthlyPayment - balance * monthlyInterestRate);
                          }
                        }
                        return totalInterest;
                      })(),
                      tooltip: `${interestRate}% annual rate over ${stayDuration} years`,
                      type: "expense"
                    },
                    {
                      label: "Maintenance & Tax",
                      value: propertyPrice * (maintenanceRate / 100) * stayDuration + propertyPrice * (propertyTaxRate / 100) * stayDuration,
                      tooltip: `${maintenanceRate}% + ${propertyTaxRate}% annually`,
                      type: "expense"
                    },
                    {
                      label: "Closing Costs",
                      value: propertyPrice * (closingCostRate / 100),
                      tooltip: `${closingCostRate}% of purchase price`,
                      type: "expense"
                    },
                    {
                      label: "Sale Proceeds",
                      value: (() => {
                        const futureValue = propertyPrice * Math.pow(1 + appreciationRate / 100, stayDuration);
                        const downPayment = propertyPrice * (downPaymentPercent / 100);
                        const loanAmount = propertyPrice - downPayment;
                        const monthlyInterestRate = interestRate / 100 / 12;
                        const totalLoanPayments = loanTermYears * 12;
                        const stayPayments = Math.min(stayDuration * 12, totalLoanPayments);
                        let remainingBalance = loanAmount;
                        if (monthlyInterestRate > 0) {
                          const monthlyPayment = loanAmount * monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -totalLoanPayments));
                          let balance = loanAmount;
                          for (let month = 1; month <= stayPayments; month++) {
                            balance -= (monthlyPayment - balance * monthlyInterestRate);
                          }
                          remainingBalance = Math.max(0, balance);
                        }
                        const sellingCosts = futureValue * (sellingCostRate / 100);
                        return futureValue - sellingCosts - remainingBalance;
                      })(),
                      tooltip: `Future value minus remaining loan and ${sellingCostRate}% selling costs`,
                      type: "income"
                    },
                    {
                      label: "Opportunity Cost",
                      value: propertyPrice * (downPaymentPercent / 100) * (Math.pow(1 + investmentReturnRate / 100, stayDuration) - 1),
                      tooltip: `Lost ${investmentReturnRate}% return on down payment`,
                      type: "expense"
                    }
                  ].map((item, index) => (
                    <div key={index} className={`flex justify-between items-center py-2 px-2 sm:px-3 rounded text-xs sm:text-sm ${index === 4 ? 'border-t-2 border-blue-300 mt-3' : ''} ${index === 5 ? 'border-t-2 border-blue-300' : ''}`}>
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        {item.label}
                        <div className="group relative">
                          <Info className="h-3 w-3 text-gray-400 cursor-help" />
                          <div className="invisible group-hover:visible absolute z-20 w-40 sm:w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -top-2 left-4">
                            {item.tooltip}
                          </div>
                        </div>
                      </span>
                      <span className={`font-bold min-w-[80px] sm:min-w-[100px] text-right ${
                        item.type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.type === 'expense' ? '+' : '-'}{formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t-2 border-blue-300 pt-3 mt-3">
                    <div className="flex justify-between items-center py-2 px-2 sm:px-3 bg-blue-200 rounded font-bold text-xs sm:text-sm">
                      <span className="text-blue-800">Net Cost</span>
                      <span className="text-blue-800 min-w-[80px] sm:min-w-[100px] text-right">{formatCurrency(buyCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Renting Breakdown */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 sm:p-5 border border-green-200">
                <h4 className="font-bold text-green-800 mb-4 text-center flex items-center justify-center gap-2 text-sm sm:text-base">
                  🏠 Renting Cash Flows
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    {
                      label: "Total Rent Payments",
                      value: (() => {
                        let total = 0;
                        let currentRent = monthlyRent;
                        for (let year = 0; year < stayDuration; year++) {
                          total += currentRent * 12;
                          currentRent *= (1 + rentGrowthRate / 100);
                        }
                        return total;
                      })(),
                      tooltip: `Starting at ${formatCurrency(monthlyRent)}/month, growing ${rentGrowthRate}% annually`,
                      type: "expense"
                    },
                    {
                      label: "Investment Gains",
                      value: (() => {
                        if (!reinvestMonthlyDiff) return 0;
                        const downPayment = propertyPrice * (downPaymentPercent / 100);
                        const loanAmount = propertyPrice - downPayment;
                        const monthlyInterestRate = interestRate / 100 / 12;
                        const totalLoanPayments = loanTermYears * 12;
                        const monthlyPayment = monthlyInterestRate > 0 ? loanAmount * monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -totalLoanPayments)) : loanAmount / totalLoanPayments;
                        const surplus = Math.max(0, monthlyPayment - monthlyRent);
                        const r = investmentReturnRate / 100;
                        const monthlyR = r / 12;
                        if (surplus > 0) {
                          if (r === 0) return surplus * 12 * stayDuration;
                          return surplus * ((Math.pow(1 + monthlyR, stayDuration * 12) - 1) / monthlyR);
                        }
                        return 0;
                      })(),
                      tooltip: `${investmentReturnRate}% return on monthly surplus ${reinvestMonthlyDiff ? '(enabled)' : '(disabled)'}`,
                      type: "income"
                    }
                  ].map((item, index) => (
                    <div key={index} className={`flex justify-between items-center py-2 px-2 sm:px-3 rounded text-xs sm:text-sm ${index === 1 ? 'border-t-2 border-green-300 mt-3' : ''}`}>
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        {item.label}
                        <div className="group relative">
                          <Info className="h-3 w-3 text-gray-400 cursor-help" />
                          <div className="invisible group-hover:visible absolute z-20 w-40 sm:w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -top-2 left-4">
                            {item.tooltip}
                          </div>
                        </div>
                      </span>
                      <span className={`font-bold min-w-[80px] sm:min-w-[100px] text-right ${
                        item.type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.type === 'expense' ? '+' : '-'}{formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t-2 border-green-300 pt-3 mt-3">
                    <div className="flex justify-between items-center py-2 px-2 sm:px-3 bg-green-200 rounded font-bold text-xs sm:text-sm">
                      <span className="text-green-800">Net Cost</span>
                      <span className="text-green-800 min-w-[80px] sm:min-w-[100px] text-right">{formatCurrency(rentCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-base sm:text-lg font-semibold text-gray-900 mb-4"
            aria-expanded={showAdvanced}
            aria-controls="advanced-settings"
          >
            <span>Advanced Settings</span>
            {showAdvanced ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {showAdvanced && (
            <div id="advanced-settings" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {renderInputField('maintenanceRate', 'Maintenance Rate', maintenanceRate, setMaintenanceRate, '1', '%/year', 0, 10, '0.1', 'Annual maintenance costs as % of property value')}
              {renderInputField('propertyTaxRate', 'Property Tax Rate', propertyTaxRate, setPropertyTaxRate, '0.2', '%/year', 0, 5, '0.01', 'Annual property tax as % of property value')}
              {renderInputField('appreciationRate', 'Property Appreciation', appreciationRate, setAppreciationRate, '3', '%/year', -10, 20, '0.1', 'Expected annual property value growth')}
              {renderInputField('closingCostRate', 'Closing Costs', closingCostRate, setClosingCostRate, '3', '% of price', 0, 10, '0.1', 'One-time costs when buying (legal, inspection, etc.)')}
              {renderInputField('sellingCostRate', 'Selling Costs', sellingCostRate, setSellingCostRate, '2', '% of sale', 0, 10, '0.1', 'Costs when selling (realtor fees, legal, etc.)')}
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div className="mb-8 text-center">
          <button
            onClick={resetCalculator}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm sm:text-base"
          >
            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Reset to Defaults
          </button>
        </div>

        {/* Disclaimer */}
        <div className="text-center text-xs sm:text-sm text-gray-600 max-w-4xl mx-auto">
          <p className="font-medium mb-2">Important Disclaimer</p>
          <p>
            This calculator provides estimates for comparison purposes only and includes opportunity cost considerations. 
            Actual costs may vary significantly based on market conditions, individual circumstances, tax implications, 
            and other factors not included in this calculation. Please consult with qualified financial and real estate 
            professionals before making housing decisions. This tool does not constitute financial advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RentVsBuyPage;
