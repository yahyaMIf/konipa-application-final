import React, { useState } from 'react';

const CustomerSearch = ({ customers, selectedCustomer, onSelectCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerSelect = (customer) => {
    onSelectCustomer(customer);
    setSearchTerm(customer.name);
    setShowDropdown(false);
  };

  return (
    <div className="customer-search">
      <h4>Select Customer</h4>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search customer..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="customer-search-input"
        />
        
        {showDropdown && filteredCustomers.length > 0 && (
          <div className="dropdown">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="dropdown-item"
                onClick={() => handleCustomerSelect(customer)}
              >
                <span>{customer.name}</span>
                <span className="customer-email">{customer.email}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="selected-customer">
          <p>Selected: {selectedCustomer.name}</p>
          <button onClick={() => onSelectCustomer(null)} className="clear-btn">
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
