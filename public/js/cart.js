document.addEventListener('DOMContentLoaded', function() {
    // Cart functionality
    const cartItems = document.querySelectorAll('.cart-item');
    const giftWrapCheckbox = document.getElementById('giftWrap');
    const giftWrapRow = document.querySelector('.gift-wrap-row');
    const subtotalElement = document.getElementById('subtotal');
    const discountElement = document.getElementById('discount');
    const giftWrapCostElement = document.getElementById('giftWrapCost');
    const finalTotalElement = document.getElementById('finalTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Cart data
    let cartData = [
        {
            id: 1,
            name: 'CEO MAN Perfume',
            price: 499.00,
            originalPrice: 599.00,
            quantity: 1,
            maxQuantity: 10
        },
        {
            id: 2,
            name: 'TEMPTATION - Perfume',
            price: 899.00,
            originalPrice: 999.00,
            quantity: 1,
            maxQuantity: 10
        }
    ];

    const giftWrapCost = 49.00;

    // Initialize cart
    function initializeCart() {
        updateCartDisplay();
        attachEventListeners();
    }

    // Attach event listeners
    function attachEventListeners() {
        // Quantity controls
        cartItems.forEach((item, index) => {
            const minusBtn = item.querySelector('.minus');
            const plusBtn = item.querySelector('.plus');
            const qtyInput = item.querySelector('.qty-input');
            const removeBtn = item.querySelector('.remove-btn');

            minusBtn.addEventListener('click', () => updateQuantity(index, -1));
            plusBtn.addEventListener('click', () => updateQuantity(index, 1));
            qtyInput.addEventListener('change', (e) => setQuantity(index, parseInt(e.target.value)));
            removeBtn.addEventListener('click', () => removeItem(index));
        });

        // Gift wrap checkbox
        if (giftWrapCheckbox) {
            giftWrapCheckbox.addEventListener('change', updateCartDisplay);
        }

        // Checkout button
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', handleCheckout);
        }
    }

    // Update quantity
    function updateQuantity(index, change) {
        const item = cartData[index];
        if (!item) return;

        const newQuantity = item.quantity + change;
        
        if (newQuantity >= 1 && newQuantity <= item.maxQuantity) {
            item.quantity = newQuantity;
            updateCartDisplay();
        }
    }

    // Set specific quantity
    function setQuantity(index, quantity) {
        const item = cartData[index];
        if (!item) return;

        if (quantity >= 1 && quantity <= item.maxQuantity) {
            item.quantity = quantity;
            updateCartDisplay();
        } else {
            // Reset to current quantity if invalid
            const qtyInput = cartItems[index].querySelector('.qty-input');
            qtyInput.value = item.quantity;
        }
    }

    // Remove item from cart
    function removeItem(index) {
        if (confirm('Are you sure you want to remove this item from your cart?')) {
            cartData.splice(index, 1);
            
            // Remove item from DOM
            cartItems[index].remove();
            
            // Update display
            updateCartDisplay();
            
            // Check if cart is empty
            if (cartData.length === 0) {
                showEmptyCart();
            }
        }
    }

    // Update cart display
    function updateCartDisplay() {
        let subtotal = 0;
        let totalDiscount = 0;

        // Update each cart item
        cartItems.forEach((item, index) => {
            const cartItem = cartData[index];
            if (!cartItem) return;

            const qtyInput = item.querySelector('.qty-input');
            const totalPriceElement = item.querySelector('.total-price');
            const originalPriceElement = item.querySelector('.original-price');

            // Update quantity input
            qtyInput.value = cartItem.quantity;

            // Calculate item total
            const itemTotal = cartItem.price * cartItem.quantity;
            const itemOriginalTotal = cartItem.originalPrice * cartItem.quantity;
            const itemDiscount = itemOriginalTotal - itemTotal;

            // Update item total display
            totalPriceElement.textContent = `₹${itemTotal.toFixed(2)}`;
            originalPriceElement.textContent = `₹${itemOriginalTotal.toFixed(2)}`;

            // Add to subtotal and discount
            subtotal += itemTotal;
            totalDiscount += itemDiscount;
        });

        // Update summary
        subtotalElement.textContent = `₹${(subtotal + totalDiscount).toFixed(2)}`;
        discountElement.textContent = `₹${totalDiscount.toFixed(2)}`;

        // Handle gift wrap
        let finalTotal = subtotal;
        if (giftWrapCheckbox && giftWrapCheckbox.checked) {
            giftWrapRow.style.display = 'flex';
            finalTotal += giftWrapCost;
        } else {
            giftWrapRow.style.display = 'none';
        }

        finalTotalElement.textContent = `₹${finalTotal.toFixed(2)}`;

        // Update checkout button state
        if (checkoutBtn) {
            checkoutBtn.disabled = cartData.length === 0;
        }
    }

    // Show empty cart
    function showEmptyCart() {
        const cartContainer = document.querySelector('.cart-container');
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added any items to your cart yet.</p>
                <a href="/shop" class="continue-shopping-btn">Continue Shopping</a>
            </div>
        `;
    }

    // Handle checkout
    function handleCheckout() {
        if (cartData.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Prepare checkout data
        const checkoutData = {
            items: cartData,
            giftWrap: giftWrapCheckbox ? giftWrapCheckbox.checked : false,
            subtotal: parseFloat(subtotalElement.textContent.replace('₹', '')),
            discount: parseFloat(discountElement.textContent.replace('₹', '')),
            giftWrapCost: giftWrapCheckbox && giftWrapCheckbox.checked ? giftWrapCost : 0,
            total: parseFloat(finalTotalElement.textContent.replace('₹', ''))
        };

        // In a real application, you would send this data to your server
        console.log('Checkout data:', checkoutData);

        // For demo purposes, show an alert
        alert('Proceeding to checkout...');
        
        // Redirect to checkout page
        // window.location.href = '/checkout';
    }

    // Wishlist functionality
    function addToWishlist(productId) {
        // In a real application, you would send this to your server
        console.log('Adding product to wishlist:', productId);
        alert('Product added to wishlist!');
    }

    // Continue shopping
    function continueShopping() {
        window.location.href = '/shop';
    }

    // Save cart to localStorage (optional)
    function saveCartToStorage() {
        localStorage.setItem('cart', JSON.stringify(cartData));
    }

    // Load cart from localStorage (optional)
    function loadCartFromStorage() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cartData = JSON.parse(savedCart);
        }
    }

    // Apply coupon code (optional feature)
    function applyCoupon(couponCode) {
        // In a real application, you would validate this with your server
        console.log('Applying coupon:', couponCode);
        
        // Example coupon logic
        if (couponCode === 'SAVE10') {
            // Apply 10% discount
            alert('Coupon applied! 10% discount added.');
            updateCartDisplay();
        } else {
            alert('Invalid coupon code.');
        }
    }

    // Initialize the cart when page loads
    initializeCart();

    // Save cart data when page unloads (optional)
    window.addEventListener('beforeunload', saveCartToStorage);
});