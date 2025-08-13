
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema');
const User = require('../../models/userSchema');


const getOffer = async (req,res)=>{
 
      const product = await Product.find({isDeleted:false , isBlocked:false}).populate('category_id brand_id')
  
      let displayProducts = product.filter(p=> p.brand_id?.status === 'active' && p.category_id?.status === 'active')
 
      let topThree = await Product.aggregate([
                                                {$match:{isDeleted:false , isBlocked:false}},

                                                 {$lookup:{
                                                            from:'categories',
                                                            localField:'category_id',
                                                            foreignField:'_id',
                                                            as: 'category'
                                                 }},
                                                  
                                                  {$unwind: '$category'},

                                                  {$lookup : {
                                                               from:'brands',
                                                               localField: 'brand_id',
                                                               foreignField:'_id',
                                                               as : 'brand'
                                                  }},

                                                    {$unwind : '$brand'},

                                                    
                                                   {$match : {
                                                                  'category.status':'active',
                                                                  'category.isDeleted' : false,
                                                                  'brand.status' : 'active',
                                                                  'brand.isDeleted' : false
                                                             }
                                                     } ,

                                                     {$addFields : {
                                                          discount : {$subtract :['$sales_price' , '$final_price' ]}
                                                     }
                                                    },

                                                     {$match: {
                                                           discount: {$gt: 0}
                                                     }
                                                    },

                                                    {$sort: {discount: -1 }},

                                                    {$limit: 3}                                         
                                             
                                              ]);
          
          const endOfToday = new Date();
           endOfToday.setHours(23, 59, 59, 999);                                    

      const coupon = await Coupon.find({isActive:true , coupon_type: 'common' , 

                                          $or : [                                       
                                                    {expiry_date:{ $gte: endOfToday}} ,
                                                    {expiry_date: { $exists:false}}, 
                                                    {expiry_date:null}
                                                ]
                                          })
                console.log(coupon , 'c')                              
     
       const user = await User.findById(req.session.user)         

     res.render('offers' , { topThree , coupon , user });
}



module.exports = {getOffer}