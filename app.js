import React, { useState, useEffect, useRef, useCallback } from 'react';

// Mock client data for autofill demonstration - Phone numbers are now plain digits
const mockClients = [
  { name: 'Sencion Performance', phoneNumber: '8015138980' },
  { name: 'Vip Auto', phoneNumber: '8019876543' },
  { name: 'Gamma Industries', phoneNumber: '5551112222' },
  { name: 'Delta Enterprises', phoneNumber: '5553334444' },
  { name: 'Acme Auto Repair', phoneNumber: '5555550001' },
  { name: 'Beta Parts Supply', phoneNumber: '5555550002' },
];

// Mock vehicle data for autofill demonstration
const mockVehicles = {
  makes: ['Honda', 'Toyota', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 'Hyundai', 'Kia'],
  models: {
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'],
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma'],
    'Ford': ['F-150', 'Escape', 'Explorer', 'Mustang', 'Focus'],
    'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Corvette'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'M3'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class'],
    'Audi': ['A3', 'A4', 'Q5', 'Q7', 'R8'],
    'Nissan': ['Altima', 'Rogue', 'Titan', 'Sentra', 'Pathfinder'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona'],
    'Kia': ['Forte', 'Optima', 'Sportage', 'Sorento', 'Telluride'],
  }
};


// QuantitySpinner Component: Handles the drag-to-change quantity interaction
const QuantitySpinner = ({ label, value, onChange, min = 0, max = 20 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(value);

  // Memoized callback for mouse/touch move
  const handleMove = useCallback((clientY) => {
    if (!isDragging) return;

    // Calculate the difference in Y position
    const diffY = startY.current - clientY;
    // Determine how many units to change based on drag sensitivity
    // Adjust sensitivity by changing the divisor (e.g., 10 for faster, 50 for slower)
    const change = Math.floor(diffY / 20); // 20 pixels per unit change

    let newValue = startValue.current + change;

    // Clamp the new value within min and max bounds
    newValue = Math.max(min, Math.min(max, newValue));

    // Only update if the value has actually changed to avoid unnecessary re-renders
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [isDragging, value, onChange, min, max]);

  // Mouse event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value; // Store the value when drag starts
    e.preventDefault(); // Prevent text selection
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startValue.current = value; // Store the value when drag starts
    e.preventDefault(); // Prevent scrolling
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add and remove global event listeners for mouse drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]); // Only re-run if isDragging or handleMouseMove changes

  return (
    <div className="flex items-center justify-between">
      <label className="block text-sm font-medium text-gray-300 w-1/2">
        {label}
      </label>
      <div
        className={`relative w-1/2 flex items-center justify-center px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 text-lg font-semibold cursor-grab select-none
          ${isDragging ? 'cursor-grabbing' : ''}
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {value}
        {/* Optional: Add small increment/decrement buttons for accessibility/precision */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col space-y-0.5">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-200 text-xs leading-none"
            onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}
          >
            &#9650; {/* Up arrow */}
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-200 text-xs leading-none"
            onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, value - 1)); }}
          >
            &#9660; {/* Down arrow */}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to format phone number
const formatPhoneNumber = (value) => {
  if (!value) return value;
  const phoneNumber = value.replace(/\D/g, ''); // Remove non-digits
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  }
  return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

// Main App component for the form
const App = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    dropOffType: '', // 'vehicle' or 'part'
    vehicleYear: 2020, // Default year set to 2020
    vehicleMake: '',
    vehicleModel: '',
    vehicleIssueDescription: '', // New field for vehicle issue
    singleStage: 0, // Initialize with 0 for spinner
    dualStage: 0,   // Initialize with 0 for spinner
    threeStage: 0,  // Initialize with 0 for spinner
    buckle: 0,      // Initialize with 0 for spinner
  });

  // State for customer name suggestions
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // State for vehicle make suggestions
  const [makeSuggestions, setMakeSuggestions] = useState([]);
  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);

  // State for vehicle model suggestions
  const [modelSuggestions, setModelSuggestions] = useState([]);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  // State for phone number validation error
  const [phoneNumberError, setPhoneNumberError] = useState('');


  // Function to validate phone number (operates on raw digits)
  const validatePhoneNumber = (number) => {
    // Remove all non-digit characters for validation
    const cleanedNumber = number.replace(/\D/g, '');
    if (cleanedNumber.length === 0) {
      return 'Phone number is required.';
    }
    if (cleanedNumber.length !== 10) {
      return 'Phone number must be exactly 10 digits.';
    }
    if (!/^\d{10}$/.test(cleanedNumber)) {
        return 'Phone number can only contain digits.';
    }
    return ''; // No error
  };


  // Handle input changes for all fields (except quantity spinners, which use their own onChange)
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (name === 'phoneNumber') {
      const rawValue = value.replace(/\D/g, ''); // Get raw digits for validation and formatting
      const formattedValue = formatPhoneNumber(rawValue); // Format for display
      setFormData((prevData) => ({
        ...prevData,
        [name]: formattedValue, // Store formatted value for display
      }));
      setPhoneNumberError(validatePhoneNumber(rawValue)); // Validate raw digits
    } else {
      setFormData((prevData) => {
        let newValue = value;
        if (type === 'number') {
          newValue = parseInt(value, 10) || 0;
        }
        return {
          ...prevData,
          [name]: newValue,
        };
      });
    }

    // Logic for customer name autofill suggestions
    if (name === 'customerName') {
      if (value.length > 1) {
        const filteredSuggestions = mockClients.filter(client =>
          client.name.toLowerCase().includes(value.toLowerCase())
        );
        setCustomerSuggestions(filteredSuggestions);
        setShowCustomerSuggestions(true);
      } else {
        setCustomerSuggestions([]);
        setShowCustomerSuggestions(false);
      }
    } else if (name === 'vehicleMake') {
      if (value.length > 0) {
        const filteredMakes = mockVehicles.makes.filter(make =>
          make.toLowerCase().includes(value.toLowerCase())
        );
        setMakeSuggestions(filteredMakes);
        setShowMakeSuggestions(true);
      } else {
        setMakeSuggestions([]);
        setShowMakeSuggestions(false);
      }
      setFormData(prevData => ({ ...prevData, vehicleModel: '' }));
      setModelSuggestions([]);
      setShowModelSuggestions(false);
    } else if (name === 'vehicleModel') {
      if (formData.vehicleMake && value.length > 0) {
        const availableModels = mockVehicles.models[formData.vehicleMake] || [];
        const filteredModels = availableModels.filter(model =>
          model.toLowerCase().includes(value.toLowerCase())
        );
        setModelSuggestions(filteredModels);
        setShowModelSuggestions(true);
      } else {
        setModelSuggestions([]);
        setShowModelSuggestions(false);
      }
    }
  };

  // Handle change for QuantitySpinner components
  const handleQuantityChange = (name, newValue) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  // Handle selection of a customer suggestion
  const handleCustomerSuggestionClick = (client) => {
    const formattedPhoneNumber = formatPhoneNumber(client.phoneNumber); // Format the autofilled number
    setFormData((prevData) => ({
      ...prevData,
      customerName: client.name,
      phoneNumber: formattedPhoneNumber,
    }));
    setCustomerSuggestions([]); // Clear suggestions
    setShowCustomerSuggestions(false); // Hide suggestions
    setPhoneNumberError(validatePhoneNumber(client.phoneNumber)); // Validate raw autofilled number
  };

  // Handle selection of a vehicle make suggestion
  const handleMakeSuggestionClick = (make) => {
    setFormData((prevData) => ({
      ...prevData,
      vehicleMake: make,
      vehicleModel: ''
    }));
    setMakeSuggestions([]);
    setShowMakeSuggestions(false);
    setModelSuggestions(mockVehicles.models[make] || []);
    setShowModelSuggestions(true);
  };

  // Handle selection of a vehicle model suggestion
  const handleModelSuggestionClick = (model) => {
    setFormData((prevData) => ({
      ...prevData,
      vehicleModel: model,
    }));
    setModelSuggestions([]);
    setShowModelSuggestions(false);
  };


  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Re-validate phone number on submission (using raw digits)
    const rawPhoneNumber = formData.phoneNumber.replace(/\D/g, '');
    const phoneError = validatePhoneNumber(rawPhoneNumber);
    setPhoneNumberError(phoneError);

    // Prevent submission if there are validation errors
    if (phoneError) {
      alert('Please fix the errors in the form before submitting.'); // Or use a custom modal
      return;
    }

    console.log('Form Data Submitted:', formData);
    // In a real application, you would send this data to a backend server
    alert('Form submitted successfully! Check console for data.');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md md:max-w-lg lg:max-w-xl border border-gray-700">
        {/* Logo */}
        <img
          src="https://images.squarespace-cdn.com/content/v1/6642e66aeaeff72f1adc408c/0fe8f795-06e1-40c2-9771-2b4c502873e9/logo+.png?format=1500w"
          alt="Company Logo"
          className="mx-auto mb-6 max-h-24 object-contain rounded-md"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x60/333333/FFFFFF?text=Logo'; }}
        />

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6 text-center">Drop-Off Form</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Customer Name with Autofill */}
          <div className="relative">
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-300 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              onFocus={() => setShowCustomerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 100)}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-gray-200"
              required
              autoComplete="off"
            />
            {showCustomerSuggestions && customerSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                {customerSuggestions.map((client) => (
                  <li
                    key={client.phoneNumber}
                    onMouseDown={() => handleCustomerSuggestionClick(client)}
                    className="px-3 py-2 cursor-pointer text-gray-200 hover:bg-gray-600 rounded-md transition-colors duration-150 ease-in-out"
                  >
                    {client.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Phone # */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-1">
              Phone #
            </label>
            <input
              type="tel" // Use type="tel" for phone numbers
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              // Validate on blur, but ensure it's called on the raw number
              onBlur={() => setPhoneNumberError(validatePhoneNumber(formData.phoneNumber.replace(/\D/g, '')))}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm bg-gray-700 text-gray-200
                ${phoneNumberError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-orange-500 focus:border-orange-500'}
              `}
              required
              placeholder="e.g., 123-456-7890"
              maxLength="12" // Max length for 10 digits + 2 hyphens
            />
            {phoneNumberError && (
              <p className="mt-1 text-sm text-red-400">{phoneNumberError}</p>
            )}
          </div>

          {/* What will you drop off? */}
          <div>
            <label htmlFor="dropOffType" className="block text-sm font-medium text-gray-300 mb-1">
              What will you drop off?
            </label>
            <select
              id="dropOffType"
              name="dropOffType"
              value={formData.dropOffType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-gray-200"
              required
            >
              <option value="">Select an option</option>
              <option value="vehicle">Vehicle</option>
              <option value="part">Part</option>
            </select>
          </div>

          {/* Conditional Fields for Vehicle */}
          {formData.dropOffType === 'vehicle' && (
            <div className="space-y-4 p-4 bg-gray-700 rounded-md border border-gray-600">
              <h3 className="text-lg font-semibold text-gray-200">Vehicle Details</h3>
              {/* Using QuantitySpinner for Year */}
              <QuantitySpinner
                label="Year"
                value={formData.vehicleYear}
                onChange={(newValue) => handleQuantityChange('vehicleYear', newValue)}
                min={1991}
                max={2026}
              />
              {/* Vehicle Make with Autofill */}
              <div className="relative">
                <label htmlFor="vehicleMake" className="block text-sm font-medium text-gray-300 mb-1">
                  Make
                </label>
                <input
                  type="text"
                  id="vehicleMake"
                  name="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={handleChange}
                  onFocus={() => setShowMakeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowMakeSuggestions(false), 100)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-gray-200"
                  placeholder="e.g., Honda"
                  required={formData.dropOffType === 'vehicle'}
                  autoComplete="off"
                />
                {showMakeSuggestions && makeSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {makeSuggestions.map((make) => (
                      <li
                        key={make}
                        onMouseDown={() => handleMakeSuggestionClick(make)}
                        className="px-3 py-2 cursor-pointer text-gray-200 hover:bg-gray-600 rounded-md transition-colors duration-150 ease-in-out"
                      >
                        {make}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Vehicle Model with Autofill */}
              <div className="relative">
                <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-300 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  id="vehicleModel"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  onFocus={() => setShowModelSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowModelSuggestions(false), 100)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-gray-200"
                  placeholder="e.g., Civic"
                  required={formData.dropOffType === 'vehicle'}
                  autoComplete="off"
                  disabled={!formData.vehicleMake} // Disable model input if no make is selected
                />
                {showModelSuggestions && modelSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {modelSuggestions.map((model) => (
                      <li
                        key={model}
                        onMouseDown={() => handleModelSuggestionClick(model)}
                        className="px-3 py-2 cursor-pointer text-gray-200 hover:bg-gray-600 rounded-md transition-colors duration-150 ease-in-out"
                      >
                        {model}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Brief Description of Issue */}
              <div>
                <label htmlFor="vehicleIssueDescription" className="block text-sm font-medium text-gray-300 mb-1">
                  Brief Description of Issue
                </label>
                <textarea
                  id="vehicleIssueDescription"
                  name="vehicleIssueDescription"
                  value={formData.vehicleIssueDescription}
                  onChange={handleChange}
                  rows="3" // Adjust rows for desired height
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-gray-200"
                  placeholder="e.g., Locked seatbealt, rh. etc..."
                  required={formData.dropOffType === 'vehicle'}
                ></textarea>
              </div>
            </div>
          )}

          {/* Conditional Fields for Part */}
          {formData.dropOffType === 'part' && (
            <div className="space-y-4 p-4 bg-gray-700 rounded-md border border-gray-600">
              <h3 className="text-lg font-semibold text-gray-200">Part Details (Quantities)</h3>
              <QuantitySpinner
                label="Single Stage(s)"
                value={formData.singleStage}
                onChange={(newValue) => handleQuantityChange('singleStage', newValue)}
              />
              <QuantitySpinner
                label="Dual Stage(s)"
                value={formData.dualStage}
                onChange={(newValue) => handleQuantityChange('dualStage', newValue)}
              />
              <QuantitySpinner
                label="3 Stage(s)"
                value={formData.threeStage}
                onChange={(newValue) => handleQuantityChange('threeStage', newValue)}
              />
              <QuantitySpinner
                label="Buckle(s)"
                value={formData.buckle}
                onChange={(newValue) => handleQuantityChange('buckle', newValue)}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 ease-in-out"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
