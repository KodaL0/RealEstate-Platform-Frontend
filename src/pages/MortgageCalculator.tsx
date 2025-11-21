import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const MortgageCalculator: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Keep these as strings so the user can type e.g. "", "150000", "150000.", etc.
  const [propertyPrice, setPropertyPrice] = useState<string>(() => searchParams.get("price") ?? "");
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>(
    () => searchParams.get("down") ?? "",
  );
  const [loanTermYears, setLoanTermYears] = useState<string>(() => searchParams.get("term") ?? "1");
  const [interestRate, setInterestRate] = useState<string>(() => searchParams.get("rate") ?? "");

  // Computed values are still numbers (or null if invalid)
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [totalPayment, setTotalPayment] = useState<number | null>(null);
  const [totalInterestPaid, setTotalInterestPaid] = useState<number | null>(null);

  const calculateMortgage = useCallback(() => {
    // Convert each input to a Number
    const priceNum = parseFloat(propertyPrice);
    const downPct = parseFloat(downPaymentPercent);
    const termYears = parseFloat(loanTermYears);
    const ratePct = parseFloat(interestRate);

    // If property price isn't a valid positive number, bail out
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setMonthlyPayment(null);
      setTotalPayment(null);
      setTotalInterestPaid(null);
      return;
    }

    // Down payment in euros; if downPct is NaN or < 0, treat as 0; if > 100, cap at 100
    const downPctClamped = Number.isNaN(downPct) ? 0 : Math.min(Math.max(downPct, 0), 100);
    const downPaymentAmount = priceNum * (downPctClamped / 100);
    const principal = priceNum - downPaymentAmount;

    // If loan term is invalid or ≤ 0, just show principal = loan amount
    if (Number.isNaN(termYears) || termYears <= 0) {
      setMonthlyPayment(0);
      setTotalPayment(principal);
      setTotalInterestPaid(0);
      return;
    }

    const numberOfPayments = termYears * 12;

    // If interest is invalid or ≤ 0, do a zero-interest simple split
    if (Number.isNaN(ratePct) || ratePct <= 0) {
      const payment = principal / numberOfPayments;
      setMonthlyPayment(payment);
      setTotalPayment(principal);
      setTotalInterestPaid(0);
      return;
    }

    // Standard amortization formula
    const monthlyRate = ratePct / 100 / 12;
    const numerator = monthlyRate * (1 + monthlyRate) ** numberOfPayments;
    const denominator = (1 + monthlyRate) ** numberOfPayments - 1;

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
  }, [propertyPrice, downPaymentPercent, loanTermYears, interestRate]);

  // Recompute whenever any input-string changes
  useEffect(() => {
    calculateMortgage();
  }, [calculateMortgage]);

  // Helper to format or show "--" if invalid
  const formatCurrency = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return "--";
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // A simple regex that allows only digits and at most one decimal point
  const numericRegex = /^(\d*\.?\d*)$/;

  return (
    <div className="bg-gray-50 min-h-screen pt-20 pb-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-lg w-full">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            Mortgage Calculator
          </h1>

          <div className="space-y-5">
            {/* Property Price */}
            <div>
              <label
                htmlFor="propertyPrice"
                className="block text-sm font-semibold text-gray-600 mb-1.5"
              >
                Property Price
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                  €
                </span>
                <input
                  type="text"
                  id="propertyPrice"
                  value={propertyPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Only update if it matches numeric pattern
                    if (val === "" || numericRegex.test(val)) {
                      setPropertyPrice(val);
                    }
                  }}
                  className="w-full h-11 pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="300000"
                />
              </div>
            </div>

            {/* Down Payment (%) */}
            <div>
              <label
                htmlFor="downPayment"
                className="block text-sm font-semibold text-gray-600 mb-1.5"
              >
                Down Payment (%)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="downPayment"
                  value={downPaymentPercent}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || numericRegex.test(val)) {
                      // Clamp to [0, 100] for display
                      if (val !== "") {
                        const asNum = parseFloat(val);
                        if (!Number.isNaN(asNum)) {
                          // if > 100, keep it at "100"
                          if (asNum > 100) {
                            setDownPaymentPercent("100");
                            return;
                          }
                        }
                      }
                      setDownPaymentPercent(val);
                    }
                  }}
                  className="w-full h-11 pr-8 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="20"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pointer-events-none">
                  %
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={
                  downPaymentPercent === ""
                    ? 0
                    : Math.min(Math.max(parseFloat(downPaymentPercent) || 0, 0), 100)
                }
                onChange={(e) => setDownPaymentPercent(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-blue-600"
              />
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                <p>
                  Down Payment Amount:{" "}
                  <span className="font-medium text-gray-700">
                    {formatCurrency(
                      Number.isNaN(parseFloat(propertyPrice))
                        ? 0
                        : parseFloat(propertyPrice) *
                            (Number.isNaN(parseFloat(downPaymentPercent))
                              ? 0
                              : Math.min(Math.max(parseFloat(downPaymentPercent), 0), 100) / 100),
                    )}
                  </span>
                </p>
                <p>
                  Loan Amount:{" "}
                  <span className="font-medium text-gray-700">
                    {formatCurrency(
                      Number.isNaN(parseFloat(propertyPrice))
                        ? 0
                        : parseFloat(propertyPrice) -
                            parseFloat(propertyPrice) *
                              (Number.isNaN(parseFloat(downPaymentPercent))
                                ? 0
                                : Math.min(Math.max(parseFloat(downPaymentPercent), 0), 100) / 100),
                    )}
                  </span>
                </p>
              </div>
            </div>

            {/* Loan Term */}
            <div>
              <label
                htmlFor="loanTerm"
                className="block text-sm font-semibold text-gray-600 mb-1.5"
              >
                Loan Term (Years)
              </label>
              <input
                type="text"
                id="loanTerm"
                value={loanTermYears}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || numericRegex.test(val)) {
                    // We will clamp to a minimum of 1 in calculation
                    setLoanTermYears(val);
                  }
                }}
                className="w-full h-11 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 30"
              />
              <div className="flex items-center space-x-3 mt-2">
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={
                    loanTermYears === "" || Number.isNaN(parseFloat(loanTermYears))
                      ? 1
                      : Math.max(1, Math.min(40, parseInt(loanTermYears, 10)))
                  }
                  onChange={(e) => setLoanTermYears(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-600 w-12 text-right">
                  {loanTermYears === "" || Number.isNaN(parseFloat(loanTermYears))
                    ? "1 yr"
                    : `${Math.max(1, parseInt(loanTermYears, 10))} yrs`}
                </span>
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <label
                htmlFor="interestRate"
                className="block text-sm font-semibold text-gray-600 mb-1.5"
              >
                Annual Interest Rate (%)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="interestRate"
                  value={interestRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || numericRegex.test(val)) {
                      setInterestRate(val);
                    }
                  }}
                  className="w-full h-11 pr-8 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="4.25"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Results */}
            <div className="pt-5 mt-3 border-t border-gray-200 space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-1 text-center">
                  Estimated Monthly Payment
                </h2>
                <p className="text-3xl md:text-4xl font-bold text-blue-600 text-center py-2 bg-blue-50 rounded-lg">
                  {formatCurrency(monthlyPayment)}
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">(Principal &amp; Interest)</p>
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

              <p className="text-xs text-gray-500 text-center pt-2">
                (Estimates do not include taxes, insurance, or HOA fees.)
              </p>

              <button
                onClick={() => {
                  // Clearing all fields
                  setPropertyPrice("");
                  setDownPaymentPercent("");
                  setLoanTermYears("1");
                  setInterestRate("");
                }}
                className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition"
              >
                Reset Calculator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;
