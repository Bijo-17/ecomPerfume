document.addEventListener('DOMContentLoaded', function() {
    // Sample addresses data
      const rawData = document.getElementById('address-data').textContent;
    const savedAddresses = JSON.parse(rawData);

    let selectedAddressId = 0;
    let editingAddressId = null;

    // DOM elements
    const additionalAddressesBtn = document.getElementById('additionalAddressesBtn');
    const addressModal = document.getElementById('addressModal');
    const addressFormModal = document.getElementById('addressFormModal');
    const closeModal = document.getElementById('closeModal');
    const closeAddressFormModal = document.getElementById('closeAddressFormModal');
    const addNewAddressBtn = document.getElementById('addNewAddressBtn');
    const addressForm = document.getElementById('addressForm');
    const cancelAddressForm = document.getElementById('cancelAddressForm');
    const addressFormTitle = document.getElementById('addressFormTitle');
    const selectedAddressContainer = document.getElementById('selectedAddress');
    const addressList = document.getElementById('addressList');

    // Payment elements
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const discountInput = document.getElementById('discountCode');
    const applyDiscountBtn = document.getElementById('applyDiscount');
    const placeOrderBtn = document.getElementById('placeOrderBtn');

    // Order summary elements
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const discountElement = document.getElementById('discount');
    const discountRow = document.querySelector('.discount-row');
    const finalTotalElement = document.getElementById('finalTotal');

    // Order data
 

    // Valid discount codes
    const discountCodes = {
        'SAVE10': { type: 'percentage', value: 10, description: '10% off' },
        'FLAT50': { type: 'fixed', value: 50, description: '₹50 off' },
        'WELCOME20': { type: 'percentage', value: 20, description: '20% off' },
        'FIRST100': { type: 'fixed', value: 100, description: '₹100 off' }
    };

    // Initialize
    function init() {
        updateAdditionalAddressesButton();
        updateSelectedAddress();
        attachEventListeners();
        updateOrderSummary();
    }

    // Attach event listeners
    function attachEventListeners() {
        // Address modal events
        additionalAddressesBtn.addEventListener('click', openAddressModal);
        closeModal.addEventListener('click', closeAddressModal);
        closeAddressFormModal.addEventListener('click', closeAddressFormModalHandler);
        addNewAddressBtn.addEventListener('click', openAddNewAddressForm);
        cancelAddressForm.addEventListener('click', closeAddressFormModalHandler);

        // Address form submission
        addressForm.addEventListener('submit', handleAddressFormSubmit);

        // Payment method change
        paymentMethods.forEach(method => {
            method.addEventListener('change', updatePaymentDetails);
        });

        // Discount code
        if (applyDiscountBtn) {
            applyDiscountBtn.addEventListener('click', applyDiscountCode);
        }

        if (discountInput) {
            discountInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyDiscountCode();
                }
            });
        }

        // Place order
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', handlePlaceOrder);
        }

        // Close modals when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === addressModal) {
                closeAddressModal();
            }
            if (event.target === addressFormModal) {
                closeAddressFormModalHandler();
            }
        });
    }

    // Update additional addresses button
    function updateAdditionalAddressesButton() {
        const additionalCount = savedAddresses.length - 1;
        if (additionalCount > 0) {
            additionalAddressesBtn.textContent = `+${additionalCount} Address${additionalCount > 1 ? 'es' : ''}`;
            additionalAddressesBtn.style.display = 'block';
        } else {
            additionalAddressesBtn.style.display = 'none';
        }
    }

    // Update selected address display
    function updateSelectedAddress() {
        const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
        if (!selectedAddress) return;

        const addressCard = selectedAddressContainer.querySelector('.address-card');
        
        addressCard.innerHTML = `
            <div class="address-header">
                <label class="address-radio">
                    <input type="radio" name="selectedAddress" value="${selectedAddress.id}" checked>
                    <span class="radio-button"></span>
                    <span class="address-type">${selectedAddress.isDefault ? 'Default' : selectedAddress.type}</span>
                </label>
                <button class="edit-btn" onclick="editAddress(${selectedAddress.id})">Edit</button>
            </div>
            <div class="address-content">
                <p class="address-name">${selectedAddress.name}</p>
                <p class="address-line">${selectedAddress.addressLine}, ${selectedAddress.locality}, ${selectedAddress.city}, ${selectedAddress.state}</p>
                <p class="address-pincode">${selectedAddress.pincode}</p>
                <p class="address-mobile">Mobile: ${selectedAddress.mobile}</p>
                <span class="address-label">${selectedAddress.type}</span>
            </div>
        `;
    }

    // Open address selection modal
    function openAddressModal() {
        populateAddressList();
        addressModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close address selection modal
    function closeAddressModal() {
        addressModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Populate address list in modal
    function populateAddressList() {
        addressList.innerHTML = '';

        savedAddresses.forEach(address => {
            const addressCard = document.createElement('div');
            addressCard.className = `modal-address-card ${address.id === selectedAddressId ? 'selected' : ''}`;
            addressCard.onclick = () => selectAddress(address._id);

            addressCard.innerHTML = `
                <div class="modal-address-header">
                    <span class="modal-address-type">${address.isDefault ? 'Default' : address.type}</span>
                    <div class="modal-address-actions">
                        <button class="modal-edit-btn" onclick="event.stopPropagation(); editAddressFromModal(${address.id})">Edit</button>
                        <button class="modal-delete-btn" onclick="event.stopPropagation(); deleteAddress(${address.id})">Delete</button>
                    </div>
                </div>
                <div class="modal-address-content">
                    <div class="modal-address-name">${address.name}</div>
                    <div>${address.address_name}</div>
                    <div>${address.locality}, ${address.city}, ${address.state} ${address.pincode}</div>
                    <div>Mobile: ${address.phone_number}</div>
                </div>
            `;

            addressList.appendChild(addressCard);
        });
    }

    // Select address
    function selectAddress(addressId) {
        selectedAddressId = addressId;
        updateSelectedAddress();
        updateAdditionalAddressesButton();
        closeAddressModal();
        
        // Show success message
        showMessage('Address selected successfully', 'success');
    }

    // Edit address (global function for inline edit button)
    window.editAddress = function(addressId) {
        editingAddressId = addressId;
        const address = savedAddresses.find(addr => addr.id === addressId);
        if (address) {
            populateAddressForm(address);
            addressFormTitle.textContent = 'Edit Address';
            addressFormModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    // Edit address from modal
    window.editAddressFromModal = function(addressId) {
        closeAddressModal();
        setTimeout(() => {
            window.editAddress(addressId);
        }, 300);
    };

    // Delete address
    window.deleteAddress = function(addressId) {
        if (savedAddresses.length <= 1) {
            showMessage('Cannot delete the last address', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this address?')) {
            savedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
            
            // If deleted address was selected, select the first available address
            if (selectedAddressId === addressId) {
                selectedAddressId = savedAddresses[0].id;
                updateSelectedAddress();
            }
            
            updateAdditionalAddressesButton();
            populateAddressList();
            showMessage('Address deleted successfully', 'success');
        }
    };

    // Open add new address form
    function openAddNewAddressForm() {
        editingAddressId = null;
        addressForm.reset();
        addressFormTitle.textContent = 'Add New Address';
        closeAddressModal();
        setTimeout(() => {
            addressFormModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 300);
    }

    // Close address form modal
    function closeAddressFormModalHandler() {
        addressFormModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        addressForm.reset();
        editingAddressId = null;
    }

    // Populate address form with existing data
    function populateAddressForm(address) {
        document.getElementById('addressId').value = address.id;
        document.getElementById('fullName').value = address.name;
        document.getElementById('mobile').value = address.mobile;
        document.getElementById('addressLine').value = address.addressLine;
        document.getElementById('locality').value = address.locality;
        document.getElementById('city').value = address.city;
        document.getElementById('state').value = address.state;
        document.getElementById('pincode').value = address.pincode;
        
        // Set address type
        const addressTypeRadio = document.querySelector(`input[name="addressType"][value="${address.address_type}"]`);
        if (addressTypeRadio) {
            addressTypeRadio.checked = true;
        }
    }

    // Handle address form submission
    function handleAddressFormSubmit(event) {
        event.preventDefault();

        const formData = new FormData(addressForm);
        const addressData = {
            name: formData.get('fullName'),
            mobile: formData.get('mobile'),
            addressLine: formData.get('addressLine'),
            locality: formData.get('locality'),
            city: formData.get('city'),
            state: formData.get('state'),
            pincode: formData.get('pincode'),
            landmark: formData.get('landmark') || '',
            type: formData.get('addressType'),
            isDefault: false
        }; 

        if (editingAddressId !== null) {
            // Update existing address
            const addressIndex = savedAddresses.findIndex(addr => addr.id === editingAddressId);
            if (addressIndex !== -1) {
                savedAddresses[addressIndex] = { ...savedAddresses[addressIndex], ...addressData };
                showMessage('Address updated successfully', 'success');
                
                // Update selected address if it was the one being edited
                if (selectedAddressId === editingAddressId) {
                    updateSelectedAddress();
                }
            }
        } else {
            // Add new address
            const newAddress = {
                id: Date.now(), // Simple ID generation
                ...addressData
            };
            savedAddresses.push(newAddress);
            showMessage('Address added successfully', 'success');
        }

        updateAdditionalAddressesButton();
        closeAddressFormModalHandler();
    }

    // Update payment details based on selected method
    function updatePaymentDetails() {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // Hide all payment details
        document.querySelectorAll('.payment-details').forEach(detail => {
            detail.style.display = 'none';
        });

        // Show selected payment details
        const selectedDetails = document.querySelector(`.${selectedMethod}-details`);
        if (selectedDetails) {
            selectedDetails.style.display = 'block';
        }

        // Update shipping cost based on payment method
        if (selectedMethod === 'cod') {
            orderData.shipping = 60.00; // COD charges
        } else {
            orderData.shipping = 40.00; // Regular shipping
        }

        updateOrderSummary();
    }

    // Apply discount code
    function applyDiscountCode() {
        const code = discountInput.value.trim().toUpperCase();
        
        if (!code) {
            showMessage('Please enter a discount code', 'error');
            return;
        }

        if (discountCodes[code]) {
            const discount = discountCodes[code];
            let discountAmount = 0;

            if (discount.type === 'percentage') {
                discountAmount = (orderData.subtotal * discount.value) / 100;
            } else {
                discountAmount = discount.value;
            }

            // Ensure discount doesn't exceed subtotal
            discountAmount = Math.min(discountAmount, orderData.subtotal);

            orderData.discount = discountAmount;
            orderData.discountCode = code;

            // Show discount row
            discountRow.style.display = 'flex';
            
            // Disable input and button
            discountInput.disabled = true;
            applyDiscountBtn.disabled = true;
            applyDiscountBtn.textContent = 'Applied';

            updateOrderSummary();
            showMessage(`Discount applied: ${discount.description}`, 'success');
        } else {
            showMessage('Invalid discount code', 'error');
        }
    }

    // Update order summary
    function updateOrderSummary() {
        orderData.total = orderData.subtotal + orderData.shipping - orderData.discount;

        subtotalElement.textContent = `₹${orderData.subtotal.toFixed(2)}`;
        shippingElement.textContent = `₹${orderData.shipping.toFixed(2)}`;
        discountElement.textContent = `-₹${orderData.discount.toFixed(2)}`;
        finalTotalElement.textContent = `₹${orderData.total.toFixed(2)}`;
    }

    // Handle place order
    function handlePlaceOrder() {
        const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
        const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        if (!selectedAddress) {
            showMessage('Please select a delivery address', 'error');
            return;
        }

        // Prepare order data
        const orderDetails = {
            address: selectedAddress,
            paymentMethod: selectedPaymentMethod,
            order: orderData
        };

        // Show loading state
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Processing...';

        // Simulate order processing
        setTimeout(() => {
            console.log('Order placed:', orderDetails);
            
            const orderId = 'ORD' + Date.now();
            showMessage(`Order placed successfully! Order ID: ${orderId}`, 'success');
            
            // Reset button
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Place your order';
            
            // Redirect to order confirmation (in real app)
            // window.location.href = `/order-confirmation/${orderId}`;
        }, 2000);
    }

    // Show message
    function showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => {
            if (msg.parentNode === document.body || msg.classList.contains('success-message')) {
                msg.remove();
            }
        });

        // Create new message
        const messageElement = document.createElement('div');
        messageElement.className = type === 'success' ? 'success-message' : 'error-message';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            padding: 12px 20px;
            border-radius: 4px;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(messageElement);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    // Initialize the checkout page
    init();
});