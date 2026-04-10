import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';


function CreateOrder({ showNotification }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    items: [{ productId: '', name: '', quantity: 1, price: 0 }]
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', name: '', quantity: 1, price: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'quantity' || field === 'price' ? Number(value) : value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await orderAPI.createOrder(formData);
      const order = response.data.data;
      
      showNotification('Order created successfully!', 'success');
      navigate(`/track/${order.orderId}`);
    } catch (error) {
      console.error('Error creating order:', error);
      showNotification(error.response?.data?.error || 'Failed to create order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-order">
      <div className="card">
        <h2>Create New Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer ID</label>
            <input
              type="text"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
              placeholder="customer-123"
            />
          </div>

          <h3>Order Items</h3>
          {formData.items.map((item, index) => (
            <div key={index} className="item-row">
              <div className="item-fields">
                <div className="form-group">
                  <label>Product ID</label>
                  <input
                    type="text"
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    required
                    placeholder="prod-456"
                  />
                </div>

                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    required
                    placeholder="Product Name"
                  />
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {formData.items.length > 1 && (
                <button
                  type="button"
                  className="btn btn-remove"
                  onClick={() => handleRemoveItem(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button type="button" className="btn btn-secondary" onClick={handleAddItem}>
            + Add Item
          </button>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateOrder;
