import React from 'react';

const CustomerProfile = ({ user }) => {
  return (
    <div className="customer-profile">
      <div className="profile-info">
        <h4>Profile Information</h4>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>Address:</strong> {user.address}</p>
      </div>
    </div>
  );
};

export default CustomerProfile;
