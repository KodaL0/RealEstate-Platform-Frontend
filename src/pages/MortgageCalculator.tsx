import React, { useState, useEffect } from 'react';

const MortgageCalculator: React.FC = () => {
  const [propertyPrice, setPropertyPrice] = useState<number>(300000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [loanTermYears, setLoanTermYears] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(4.25);
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [totalPayment, setTotalPayment] = useState<number | null>(null);
  const [totalInterestPaid, setTotalInterestPaid] = useState<number | null>(null);

  useEffect(() => {
    calculateMortgage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyPrice, downPaymentPercent, loanTermYears, interestRate]);

  const calculateMortgage = () => {
    const downPaymentAmount = propertyPrice * (downPaymentPercent / 100);
    const principal = propertyPrice - downPaymentAmount;
    
    if (principal <= 0 || loanTermYears <= 0) {
      setMonthlyPayment(0);
      setTotalPayment(principal > 0 ? principal : 0);
      setTotalInterestPaid(0);
      return;
    }

    const numberOfPayments = loanTermYears * 12;

    if (interestRate <= 0) {
        const payment = numberOfPayments > 0 ? principal / numberOfPayments : 0;
        setMonthlyPayment(payment);
        setTotalPayment(principal);
        setTotalInterestPaid(0);
        return;
    }

    const monthlyInterestRate = interestRate / 100 / 12;
    const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments);
    const denominator = Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1;

    if (denominator <= 0) {
        setMonthlyPayment(null); 
        setTotalPayment(null);
        setTotalInterestPaid(null);
        return;
    }

    const payment = principal * (numerator / denominator);
    const totalPaid = payment * numberOfPayments;
    setMonthlyPayment(payment);
    setTotalPayment(totalPaid);
    setTotalInterestPaid(totalPaid - principal);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || isNaN(value)) return '--';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-lg w-full">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">Mortgage Calculator</h1>
          
          <div className="space-y-5"> 
            {/* Property Price */}
            <div>
              <label htmlFor="propertyPrice" className="block text-sm font-semibold text-gray-600 mb-1.5">Property Price</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">€</span>
                <input
                  type="number"
                  id="propertyPrice"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-11 pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  placeholder="e.g., 300000"
                  min="0"
                />
              </div>
            </div>

            {/* Down Payment Percentage with Slider */}
            <div>
              <label htmlFor="downPayment" className="block text-sm font-semibold text-gray-600 mb-1.5">Down Payment (%)</label>
              <div className="relative">
                <input
                  type="number"
                  id="downPayment"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="w-full h-11 pr-8 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  placeholder="e.g., 20"
                  step="0.1"
                  min="0"
                  max="100"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pointer-events-none">%</span>
              </div>
              {/* Slider for Down Payment */}
              <input 
                 type="range"
                 min="0"
                 max="100"
                 step="0.5" 
                 value={downPaymentPercent}
                 onChange={(e) => setDownPaymentPercent(parseFloat(e.target.value))}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-blue-600"
              />
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                <p>Down Payment Amount: <span className="font-medium text-gray-700">{formatCurrency(propertyPrice * (downPaymentPercent / 100))}</span></p>
                <p>Loan Amount: <span className="font-medium text-gray-700">{formatCurrency(propertyPrice - (propertyPrice * (downPaymentPercent / 100)))}</span></p>
              </div>
            </div>

            {/* Loan Term with Slider */}
            <div>
              <label htmlFor="loanTerm" className="block text-sm font-semibold text-gray-600 mb-1.5">Loan Term (Years)</label>
              <input
                type="number"
                id="loanTerm"
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-11 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                placeholder="e.g., 30"
                min="1"
              />
               {/* Slider for Loan Term */}
               <div className="flex items-center space-x-3 mt-2">
                 <input 
                   type="range"
                   min="1"
                   max="40" // Example max term
                   step="1"
                   value={loanTermYears}
                   onChange={(e) => setLoanTermYears(parseInt(e.target.value))}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                 />
                 <span className="text-sm font-medium text-gray-600 w-12 text-right">{loanTermYears} yrs</span>
               </div>
            </div>

            {/* Interest Rate (Editable) */}
            <div>
              <label htmlFor="interestRate" className="block text-sm font-semibold text-gray-600 mb-1.5">Annual Interest Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  id="interestRate"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-11 pr-8 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  placeholder="e.g., 4.25"
                  step="0.01"
                  min="0"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pointer-events-none">%</span>
              </div>
            </div>

            {/* Result Display */}
            <div className="pt-5 mt-3 border-t border-gray-200 space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-1 text-center">Estimated Monthly Payment</h2>
                <p className="text-3xl md:text-4xl font-bold text-blue-600 text-center py-2 bg-blue-50 rounded-lg">
                  {formatCurrency(monthlyPayment)}
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">(Principal & Interest)</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                 <div>
                     <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Payment</h3>
                     <p className="text-lg font-medium text-gray-700">
                       {formatCurrency(totalPayment)}
                     </p>
                 </div>
                 <div>
                     <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Interest Paid</h3>
                     <p className="text-lg font-medium text-gray-700">
                       {formatCurrency(totalInterestPaid)}
                     </p>
                 </div>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2"> (Estimates do not include taxes, insurance, or HOA fees.)</p>
            </div>
          </div> 
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator; 