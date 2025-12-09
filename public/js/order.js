// Orders functionality
   document.addEventListener('DOMContentLoaded', function(){ 
    // load more orders

    let page = 2;
    let loading = false;
    let hasMore = JSON.parse(document.getElementById('hasmore').textContent);
    const mainContainer = document.querySelector('.orders-content');
    const container = document.getElementById('ordersList');
    const resultdiv = document.getElementById("resultdiv");

    async function loadOrders(){
    
       if(!hasMore || loading) return;
        loading = true;
        const loader = document.getElementById('loader');
        loader.style.display = "block";
      

       try {
         
          const res = await fetch("/orders/loadmore?page="+page);
          const data = await res.json();
          const container = document.getElementById('ordersList')
          const orders = data.orders;
          

           renderOrders(orders);

          page++;
          hasMore = data.hasMore;
          loading=false;
          loader.style.display = "none";
          const orderdata = document.getElementById('order-data');
          let existingOrders = [];
          existingOrders = JSON.parse(orderdata.textContent);
         
          const mergedOrders = [...existingOrders , ...orders];
          orderdata.textContent = JSON.stringify(mergedOrders);

          initializeOrders();
                

          if(!hasMore){
             loader.style.display = "none";
             document.getElementById("end-message").style.display = "block";
          }

       } catch (error) {
          const loader = document.getElementById("loader").style.display = "block";
           loader.textContent = 'something Went wrong try again';
       } 
    }



     function renderOrders(orders){

        try{ 
          
         for(let i =0 ; i< orders.length ; i++) {
               
           orders[i].order_items.forEach((product, index)=> {
         
          const orderItemsdiv = document.createElement('div');
         
            orderItemsdiv.classList.add('order-item');
            orderItemsdiv.dataset.orderId = orders[i].order_id;
            orderItemsdiv.dataset.productId = product.product_id._id;
            orderItemsdiv.dataset.volume = product.volume;
            orderItemsdiv.dataset.productorderid = product._id;
   
            const orderProductdiv = document.createElement('div');
             orderProductdiv.classList.add('order-product');

              const productImgdiv = document.createElement('div');
               productImgdiv.classList.add('product-image');
               const img = document.createElement('img');
               img.src = product.product_id.image[0];
               img.alt = 'product img';
               productImgdiv.appendChild(img);
           
               const productDetailsdiv = document.createElement('div');
                productDetailsdiv.classList.add('product-details');

                     const productBranddiv = document.createElement('div');
                      productBranddiv.classList.add('product-brand');
                      productBranddiv.textContent = product.brand_name;

                      const productNamediv = document.createElement('div');
                       productNamediv.classList.add('product-name');
                       productNamediv.textContent = '-'+product.product_id.product_name;
                
                      const ratingdiv = document.createElement('div');
                       ratingdiv.classList.add('product-rating');
                    
                        const starsdiv = document.createElement('div');
                        starsdiv.classList.add('stars');
                        starsdiv.style.alignItems = 'center';
       
                         for(let s=1; s<=5; s++){
                        
                                if(product.product_id.averageRating >= s){
                                    const star = document.createElement('i');
                                     star.classList.add('fas');
                                     star.classList.add('fa-star');
                                     star.classList.add('filled')
                                     starsdiv.appendChild(star);
                                  } else {
                                     const star = document.createElement('i');
                                     star.classList.add('fas');
                                     star.classList.add('fa-star');
                                     starsdiv.appendChild(star);
                                   
                                  }
                             }
              
                            const ratingCountdiv = document.createElement('span');
                            ratingCountdiv.style.fontSize = "0.9rem";
                            ratingCountdiv.textContent = '('+product.product_id.ratingCount+')';
                            starsdiv.appendChild(ratingCountdiv)
                       ratingdiv.appendChild(starsdiv);
                     
                         const productPricediv = document.createElement('div');
                         productPricediv.classList.add('product-price');
                         productPricediv.textContent = product.product_price;

                           const quantityspan = document.createElement('span');
                            quantityspan.classList.add('quantity-badge');
                            quantityspan.textContent = 'x '+ product.quantity;

                          productPricediv.appendChild(quantityspan);

                 productDetailsdiv.appendChild(productBranddiv);
                 productDetailsdiv.appendChild(productNamediv);
                 productDetailsdiv.appendChild(ratingdiv);
                 productDetailsdiv.appendChild(productPricediv);

               orderProductdiv.appendChild(productImgdiv);
               orderProductdiv.appendChild(productDetailsdiv);  
         
                 const orderStatusSectiondiv = document.createElement('div');
                  orderStatusSectiondiv.classList.add('order-status-section');

                    const orderStatusdiv = document.createElement('div');
                     orderStatusdiv.classList.add('order-status');
                      
                        const statusspan = document.createElement('span');
                         statusspan.classList.add('status-label');
                         statusspan.textContent = 'Status :'
                        const orderStatusspan = document.createElement('span');
                         orderStatusspan.classList.add('status-value');
                         orderStatusspan.classList.add(product.order_status);
                         orderStatusspan.textContent = product.order_status;

                       orderStatusdiv.appendChild(statusspan);
                       orderStatusdiv.appendChild(orderStatusspan);

                      const orderDatediv = document.createElement('div');
                       orderDatediv.classList.add('order-date');
                         const orderDate = new Date ( orders[i].order_date);
                        orderDatediv.textContent = orderDate.toISOString().substring(0,10);

                     orderStatusSectiondiv.appendChild(orderStatusdiv);
                     orderStatusSectiondiv.appendChild(orderDatediv);

                     const orderActiondiv = document.createElement('div');
                      orderActiondiv.classList.add('order-actions');
                        
                         const actionbar = document.createElement('i');
                          actionbar.classList.add('fas','fa-chevron-right');

                       orderActiondiv.appendChild(actionbar);
                     
              
               

              orderItemsdiv.appendChild(orderProductdiv);
              orderItemsdiv.appendChild(orderStatusSectiondiv);
              orderItemsdiv.appendChild(orderActiondiv);

            container.appendChild(orderItemsdiv);

    
           })
         }

         

        } catch (error){
            document.getElementById("loader").textContent = 'Something went worng , try again'
        }


     }


     const observer = new IntersectionObserver((entries)=>{
        
         if(entries[0].isIntersecting && !loading && hasMore){
         
              loadOrders();
            
          }
      
      }, { threshold : 1});
 
       observer.observe(resultdiv);


    
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
                    const volume = this.getAttribute('data-volume')
                    const productOrderId = this.getAttribute('data-productorderid')
    
                    viewOrderDetails(orderId, productId , volume , productOrderId);
                  
                }
            });
        });
    }

    // View order details (global function)
    window.viewOrderDetails = function(orderId , productId , volume , productOrderId) {
        const orders = JSON.parse(document.getElementById('order-data').textContent);
        const order = orders.find(o=> o.order_id === orderId)
     
        if (!order) {
            showNotification('Order not foundzz', 'error');
            return;
        }

      const product = order.order_items.find(item => item.product_id._id === productId && item.volume === Number(volume) );

         if (!product) {
          showNotification('Product not found', 'error');
              return;
        }

        
        populateOrderDetailsModal(order, product , productOrderId);

        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    // Populate order details modal
    function populateOrderDetailsModal(order,product,productOrderId) {
        const modalBody = document.getElementById('orderModalBody');

        if (!modalBody) return;
   
      const productItem = order.order_items.find(item => item._id.toString() === productOrderId);
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
                <a href='/productDetails/${product.product_id._id}' >
                    <div class="modal-product-image">
                        <img src="${product.product_id.image[0]}" alt="${product.product_id.product_name}">
                    </div>
                    <div class="modal-product-info">
                        <div class="modal-product-name">${product.product_id.product_name} (${product.volume} ML)</div>
                        <div class="modal-product-price">₹${product.product_price}  × ${product.quantity }</div>
                        <div class="product-rating">
                            ${generateStars(product.product_id.averageRating)}
                        </div>
                        </a>
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
                      <strong>Discount:</strong> ${order?.discount.toFixed(2)}<br>
                       ${''? `<strong>Card:</strong> ${''}<br>` : ''}
                        ${'' ? `<strong>UPI ID:</strong> ${''}<br>` : ''}
                     <strong>Product Price :</strong> ₹${((product.product_price*product.quantity)+product.delivery_charge).toFixed(2)} <br>
                     <strong>Total Order Price : </strong> ₹${order.total_price.toFixed(2)}
                </div>
            </div>

            ${order.cancelReason ? `
                <div class="order-detail-section">
                    <h4>Cancellation Reason</h4>
                    <div class="cancel-reason">${order.cancelReason}</div>
                </div>
            ` : ''}

            <div class="order-actions-modal">
                ${generateOrderActions(order,product.product_id._id, product.volume , productOrderId)}
              
            </div>
        ${ (order.order_items.length > 1) ?
            `<div class="order-detail-section mt-4"> 
               <h4>Other products in this order </h4>
               <div class='modal-product-details'>
                  ${generateOtherProducts(order, product.product_id._id, product.volume)}
               </div>
            </div>`
           : '' }

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

    function generateOtherProducts(order, productId , volume){

          const otherProducts = order.order_items.filter(p=> p.product_id._id.toString() !== productId || p.volume !== volume)
      
        return otherProducts.map(element => {
        
              return  ` <div style="cursor:pointer" class="other-product" data-order-id=${order.order_id} data-product-id=${element.product_id._id} data-volume=${element.volume} data-productOrderId=${element._id}>  
                         <img src="${element.product_id.image[0]}" alt="${element.product_id.product_name}" style="width:50px;height:50px;">
                         <span>${element.product_id.product_name} (${element.volume} ML)</span>
                   <div> <hr style='margin-top: 6px'>
                 `;
          }).join('');

       
    }

    document.addEventListener("click", function (e) {
         const el = e.target.closest(".other-product");
     if (el) {
        
               const orderId = el.getAttribute("data-order-id");
               const productId = el.getAttribute("data-product-id");
               const volume = el.getAttribute('data-volume')
               const productOrderId = el.getAttribute('data-productOrderId')
               viewOrderDetails(orderId, productId , volume , productOrderId);
             }
    });

    // Generate order actions based on status
    function generateOrderActions(order,productId , volume , productOrderId) {
   

        const productItem = order.order_items.find(item => item._id.toString() === productOrderId );

        if (!productItem) return '';

 
    const status = productItem.order_status;

    if(status === 'delivered' && productItem.return_request.status === 'requested'){
        
       return  `<button class="action-btn btn-warning" > Return requested </button>`

    }else if(status === 'delivered' && productItem.return_request.status === 'approved'){
        
       return  `<button class="action-btn btn-warning" > Return request accepted </button>` 

    }else if(status === 'delivered' && productItem.return_request.status === 'rejected'){
        
       return  `<button class="action-btn btn-warning" > Return requested rejected </button>` 
    }


        switch (status) {
            case 'pending':
                return `
                     <button class="action-btn btn-primary" onclick="trackOrder('${order.order_id}')">Track Order</button>
                    <button class="action-btn btn-warning" onclick="cancelProduct('${order.order_id}','${productId}','${productOrderId}')">Cancel Product</button>
                    <button class="action-btn btn-danger" onclick="cancelFullOrder('${order.order_id}')">Cancel Full Order</button>
                `;
            case 'shipped':
                return `
                     <button class="action-btn btn-primary" onclick="trackOrder('${order.order_id}')">Track Order</button>
                    <button class="action-btn btn-danger" onclick="cancelProduct('${order.order_id}','${productId}','${productOrderId}')">Cancel Order</button>
                    <button class="action-btn btn-danger" onclick="cancelFullOrder('${order.order_id}')">Cancel Full Order</button>
                `;
            case 'out_for_delivery':
                return `
                     <button class="action-btn btn-primary" onclick="trackOrder('${order.order_id}')">Track Order</button>
                    <button class="action-btn btn-danger" onclick="cancelProduct('${order.order_id}','${productId}','${productOrderId}')">Cancel Order</button>
                    <button class="action-btn btn-danger" onclick="cancelFullOrder('${order.order_id}')">Cancel Full Order</button>
                `;                

            case 'delivered':
                return `
                    <button class="action-btn btn-primary" onclick="returnProduct('${order.order_id}','${productOrderId}')">Return</button>
                  
                    <a href="/downloadInvoice/${encodeURIComponent(order.order_id)}/${productId}" class="action-btn btn-secondary">Download Invoice</a>
                `;
            case 'cancelled':
                return `
                    <button class="action-btn btn-primary" onclick="reorderProduct('${productId}','${volume}')">Reorder</button>
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
            window.location.reload();
        }, 1000);
    };

    window.cancelProduct = function(orderId,productId,productOrderId) {
           
           document.getElementById("cancelModal").classList.add("active");
           document.body.style.overflow = "hidden";
        
            
          document.getElementById('cancelProductBtn').addEventListener('click', ()=> {
          
              const reason = document.getElementById('cancelReason').value;
                  fetch(`/CancelOrder/${encodeURIComponent(orderId)}/${productId}/${productOrderId}`, {
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

      })
           
        
    };


     window.cancelFullOrder = function(orderId) {
           
           document.getElementById("cancelFullOrderModal").classList.add("active");
           document.body.style.overflow = "hidden";
            
          document.getElementById('cancelFullOrderBtn').addEventListener('click', ()=> {
          
              const reason = document.getElementById('cancelFullOrderReason').value;
                  fetch(`/CancelFullOrder/${encodeURIComponent(orderId)}`, {
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

      })
           
        
    };

    window.closeCancelModal = function() {
    document.getElementById("cancelModal").classList.remove("active");
    document.body.style.overflow = "auto";
    document.getElementById("cancelReason").value = ""; // reset textarea
}

 window.closeCancelFullOrderModal = function() {
    document.getElementById("cancelFullOrderModal").classList.remove("active");
    document.body.style.overflow = "auto";
    document.getElementById("cancelFullOrderReason").value = ""; // reset textarea
}

  window.sumbitCancelReason = function () {
     


  }

  

     window.reorderProduct = async function(productId, volume) {

    
       try{ 

              showNotification('Adding product to cart...', 'success');

              const response = await fetch(`/addToCart/${productId}`, {
                method : 'POST',
                headers: {'Content-Type' : 'application/json'},
                body : JSON.stringify({volume})
              })

                const data = await response.json();

            if(data.success){
                window.location.href = '/cart';
            } else {
                showNotification("Failed to add product to cart,Please Check the product and try again" , "error");
            }
      
    
          } catch (error) {
              showNotification("Something went wrong", "error");
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


    showNotification("Return request submitted", "success");

  
    
    fetch(`/returnOrder/${encodeURIComponent(currentReturnOrderId)}/${currentProductId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ reason })
    }).then(res => {
        if(res.ok){ 
             showNotification("Return successful", "success");
             window.location.reload();
        }
        else { 
               showNotification("Failed to return", "error");
        }  
    });
    

    closeReturnModal();
}




    window.downloadInvoice = function(orderId,productId) {

        showNotification('Downloading invoice...', 'success');
       
         if (orderId) {

           fetch(`/orders/downloadInvoice/${encodeURIComponent(orderId)}/${productId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
        
        }).then(response => {
            if (!response.ok) {
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