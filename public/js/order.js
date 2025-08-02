// Orders functionality
document.addEventListener('DOMContentLoaded', function() {
   
    
    // Initialize orders functionality
    function initializeOrders() {
        attachOrderEventListeners();
    }

    // Attach event listeners for orders
    function attachOrderEventListeners() {
        // Close modal
        const closeModal = document.getElementById('closeOrderModal');
        if (closeModal) {
            closeModal.addEventListener('click', closeOrderDetailsModal);
        }

        // Close modal when clicking outside
        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    closeOrderDetailsModal();
                }
            });
        }

        // Order item click handlers
        const orderItems = document.querySelectorAll('.order-item');
        orderItems.forEach(item => {
            item.addEventListener('click', function(e) {
                if (!e.target.closest('.view-details-btn')) {
                    const orderId = this.getAttribute('data-order-id');
                    const productId = this.getAttribute('data-product-id')
                    viewOrderDetails(orderId, productId);
                }
            });
        });
    }

    // View order details (global function)
    window.viewOrderDetails = function(orderId , productId) {
        const orders = JSON.parse(document.getElementById('order-data').textContent);

        const order = orders.find(o=> o.order_id === orderId)
     

        
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

      const product = order.order_items.find(item => item.product_id._id === productId);

         if (!product) {
          showNotification('Product not found', 'error');
              return;
        }

  
        
        populateOrderDetailsModal(order, product);

        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    // Populate order details modal
    function populateOrderDetailsModal(order,product) {
        const modalBody = document.getElementById('orderModalBody');
        if (!modalBody) return;

   
       
      const productItem = order.order_items.find(item => item.product_id === product.product_id || item.product_id._id === product.product_id._id);

  

        const statusClass = productItem.order_status.toLowerCase();

        const address = order?.address_id || order?.temp_address
          let displayDate = order?.delivered_date || order?.cancelled_date || order?.estimated_delivery 

         if(productItem.order_status === 'cancelled'){
            displayDate =  productItem.cancelled_date 
         }
        
        modalBody.innerHTML = `
            <div class="order-detail-section">
                <h4>Order Information</h4>
                <div class="order-info-grid">
                    <div class="info-item">
                        <span class="info-label">Order ID</span>
                        <span class="info-value">${order.order_id}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Order Date</span>
                        <span class="info-value">${new Date(order?.order_date).toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status</span>
                        <span class="info-value">
                            <span class="status-value ${statusClass}">${productItem.order_status}</span>
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${productItem.order_status === 'delivered' ? 'Delivered Date' : productItem.order_status === 'cancelled' ? 'Cancelled Date' : productItem.order_status === 'failed' ? 'Failed' : 'Estimated delivery' }</span>
                        <span class="info-value"> 
                                                     ${displayDate ? new Date(displayDate).toLocaleDateString() : ''} 
                          </span>
                    </div>
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Product Details</h4>
                <div class="modal-product-details">
                    <div class="modal-product-image">
                        <img src="${product.product_id.image[0]}" alt="${product.product_id.product_name}">
                    </div>
                    <div class="modal-product-info">
                        <div class="modal-product-name">${product.product_id.product_name}</div>
                        <div class="modal-product-price">₹${product.product_price}  × ${product.quantity }</div>
                        <div class="product-rating">
                            ${generateStars(product.product_id.averageRating)}
                        </div>
                    </div>
                </div>
            </div>
                  
            <div class="order-detail-section">
                <h4>Delivery Address</h4>
                <div class="address-details">
                    <strong>${address?.name}</strong><br>
                    ${ address?.address_name}<br>
                    ${address?.city}<br>
                    ${address?.pin_code} <br>
                    Mobile: ${address?.phone_number}
                </div>
            </div>

            <div class="order-detail-section">
                <h4>Payment Information</h4>
                <div class="payment-details">
                    <strong>Payment Method:</strong> ${order.payment_method.method}<br>
                     <strong>Delivery:</strong> ${product.delivery_charge}<br>
                      <strong>Discount:</strong> ${order?.discount}<br>
                       ${''? `<strong>Card:</strong> ${''}<br>` : ''}
                        ${'' ? `<strong>UPI ID:</strong> ${''}<br>` : ''}
                     <strong>Amount :</strong> ₹${((product.product_price*product.quantity)+product.delivery_charge).toFixed(2)}
                </div>
            </div>

            ${order.cancelReason ? `
                <div class="order-detail-section">
                    <h4>Cancellation Reason</h4>
                    <div class="cancel-reason">${order.cancelReason}</div>
                </div>
            ` : ''}

            <div class="order-actions-modal">
                ${generateOrderActions(order,product.product_id._id)}
              
            </div>
        `;

    
    }

    // Generate stars for rating
    function generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star filled"></i>';
            } else {
                stars += '<i class="fas fa-star"></i>';
            }
        }
        return `<div class="stars">${stars}</div>`;
    }

    // Generate order actions based on status
    function generateOrderActions(order,productId) {
   

        const productItem = order.order_items.find(item => item.product_id === productId || item.product_id._id === productId);

        if (!productItem) return '';

 
    const status = productItem.order_status;

    if(status === 'delivered' && productItem.return_request.status === 'requested'){
        
       return  `<button class="action-btn btn-warning" > Return requested </button>`

    }else if(status === 'delivered' && productItem.return_request.status === 'approved'){
        
       return  `<button class="action-btn btn-warning" > Return requested accepted </button>` 

    }else if(status === 'delivered' && productItem.return_request.status === 'rejected'){
        
       return  `<button class="action-btn btn-warning" > Return requested rejected </button>` 
    }


        switch (status) {
            case 'pending':
                return `
                     <button class="action-btn btn-primary" onclick="trackOrder('${order.order_id}')">Track Order</button>
                    <button class="action-btn btn-danger" onclick="cancelOrder('${order.order_id}','${productId}')">Cancel Order</button>
                `;
            case 'shipped':
                return `
                     <button class="action-btn btn-primary" onclick="trackOrder('${order.order_id}')">Track Order</button>
                    <button class="action-btn btn-danger" onclick="cancelOrder('${order.order_id}','${productId}')">Cancel Order</button>
                `;
            case 'out_for_delivery':
                return `
                     <button class="action-btn btn-primary" onclick="trackOrder('${order.order_id}')">Track Order</button>
                    <button class="action-btn btn-danger" onclick="cancelOrder('${order.order_id}','${productId}')">Cancel Order</button>
                `;                

            case 'delivered':
                return `
                    <button class="action-btn btn-primary" onclick="returnProduct('${order.order_id}','${productId}')">Return</button>
                  
                    <a href="/downloadInvoice/${encodeURIComponent(order.order_id)}/${productId}" class="action-btn btn-secondary">Download Invoice</a>
                `;
            case 'cancelled':
                return `
                    <button class="action-btn btn-primary" onclick="reorderProduct('${order.order_id}')">Reorder</button>
                `;
                case 'failed':
                return `
                    <button class="action-btn btn-primary" onclick="retryPayment('${order.order_id}')">Retry</button>
                `;
            default:
                return '';
        }


    }

    // Close order details modal
    function closeOrderDetailsModal() {
        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    // Order action functions (global)
    window.trackOrder = function(orderId) {
        showNotification('Redirecting to order tracking...', 'success');
        setTimeout(() => {
            window.location.href = `/track-order/${orderId}`;
        }, 1000);
    };

    window.cancelOrder = function(orderId,productId) {
        if (confirm('Are you sure you want to cancel this order?')) {
        

            
              const reason = prompt("Please enter the reason for cancellation (optional):");

              fetch(`/CancelOrder/${encodeURIComponent(orderId)}/${productId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason })
        }).then(response => {
            if (response.ok) {
                showNotification("Product cancelled", "success");
                window.location.reload();
            } else {
                showNotification("Failed to cancell product", "error");
            }
        });
        
    } else {
        showNotification('Failed to send cancellation request.', 'error');
    }


            closeOrderDetailsModal();
             
        
    };

  

    window.reorderProduct = function(orderId) {

        const orders = JSON.parse(document.getElementById('order-data').textContent);

        const order = orders.find(o=> o.order_id === orderId)
      
        if (order) {
            showNotification('Adding product to cart...', 'success');
            setTimeout(() => {
                window.location.href = '/cart';
            }, 1000);
        }
    };

    window.retryPayment = function(orderId) {

        showNotification("Retrying payment...","success")
         
        fetch("/retryPayment",{
            method:'POST',
            headers: {  'Content-Type' : 'application/json'},
            body: JSON.stringify({orderId})

        }).then(async res=>{

            const data = await res.json()
            if(!res.ok){
                
                    showNotification(data.message || "payment retrying failed" , "error") 
                    return;
            } else {
                 return data

            }

            })
            .then(data => { 

             if(data){

          const options = {
            key: data.key,
            amount: data.order.amount,
            currency: "INR",    
            name: "Petal and Mist",
            description: "Order Payment",
            order_id: data.order.id,
            handler: function (response) {
              
                verifyPayment(response, data.order.id );
            },
            prefill: {
                name: data.user.name,
                email: data.user.email,
                contact: data.user.phone
            },
            theme: {
                color: "#3399cc"
            }
        };

        const rzp = new Razorpay(options);
     
        rzp.open();

        rzp.on('payment.failed', function (response){
        
           window.location.href = '/orders/failed';
       });

      }
            
        }).catch(err=>{


            showNotification("something went wrong "+err.message , "error")
        })

           closeOrderDetailsModal()
    }


    
async function verifyPayment(paymentResponse, orderId) {
    try {

        const res = await fetch('/orders/razorpay/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...paymentResponse,
                orderId

            })
        });

        const result = await res.json();

        if (result.success) {
            showNotification("Success", "Your payment was successful!", "success")
                window.location.href = "/orders/success"
        } else {
            return showNotification( result.message ,"error" || "Payment verification failed", "error")
                window.location.reload()
        } 

    } catch (error) {
      
        return showNotification("Could not verify payment", "error");
    }
}




  
  let currentReturnOrderId = null;
  let currentProductId = null;

window.returnProduct = function(orderId ,productId) {
    currentReturnOrderId = orderId;
    currentProductId = productId
    document.getElementById("returnModal").classList.add("active");
    document.body.style.overflow = "hidden";
};

window.closeReturnModal = function() {
    document.getElementById("returnModal").classList.remove("active");
    document.body.style.overflow = "auto";
    document.getElementById("returnReason").value = ""; // reset textarea
}

window.submitReturnReason = function() {
    const reason = document.getElementById("returnReason").value.trim();

    if (!reason || reason.length<6) {
        showNotification("Please enter a reason to return the product", "error");
        return;
    }

    // Simulated response or API call
    showNotification("Return request submitted", "success");

  
    
    fetch(`/returnOrder/${encodeURIComponent(currentReturnOrderId)}/${currentProductId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ reason })
    }).then(res => {
        if(res.ok) showNotification("Return successful", "success");
        else showNotification("Failed to return", "error");
    });
    

    closeReturnModal();
}




    window.downloadInvoice = function(orderId,productId) {
        // showNotification('Downloading invoice...', 'success');
       

         if (orderId) {

           fetch(`/orders/downloadInvoice/${encodeURIComponent(orderId)}/${productId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
        
        }).then(response => {
            if (response.ok) {
                showNotification("Downloading Invoice...", "success");
                
            } else {
                showNotification("Failed to download Invoice", "error");
            }
        });
        
    } else {
        showNotification('Failed to download invoice. orderId not found', 'error');
    }


            closeOrderDetailsModal();


    };



    // Show notification function
    function showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Initialize orders when this section is loaded
    if (document.querySelector('.orders-content')) {
        initializeOrders();
    }
});