'use client';

import React, { useState } from 'react';
import './CueForm.css';

const CueForm = () => {
  const [cueData, setCueData] = useState({
    timing: '',
    description: '',
    roles: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCueData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/cues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cueData),
      });

      if (!response.ok) {
        throw new Error('Failed to create cue');
      }

      // Reset form after successful submission
      setCueData({
        timing: '',
        description: '',
        roles: '',
      });

      alert('Cue created successfully!');
    } catch (error) {
      console.error('Error creating cue:', error);
      alert('Failed to create cue. Please try again.');
    }
  };

  return (
    <div className="cue-form-container">
      <h2>Add New Cue</h2>
      <form onSubmit={handleSubmit} className="cue-form">
        <div className="form-group">
          <label htmlFor="timing">Timing:</label>
          <input
            type="text"
            id="timing"
            name="timing"
            value={cueData.timing}
            onChange={handleInputChange}
            placeholder="Enter cue timing"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={cueData.description}
            onChange={handleInputChange}
            placeholder="Enter cue description"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="roles">Assigned Roles:</label>
          <input
            type="text"
            id="roles"
            name="roles"
            value={cueData.roles}
            onChange={handleInputChange}
            placeholder="Enter assigned roles (comma-separated)"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Create Cue
        </button>
      </form>
    </div>
  );
};

export default CueForm;
