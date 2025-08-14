
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema');
const User = require('../../models/userSchema');


const getOffer = async (req,res)=>{

      try{ 
 
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

                                                      {$lookup : {   
                                                                      from : 'varients',
                                                                      localField : 'varients_id',
                                                                      foreignField : '_id',
                                                                      as : 'varient'

                                                                  }
                                                      },

                                                        {$unwind : '$varient'},

                                                     {$addFields : {
                                                          discount : {$subtract :['$regular_price' , '$final_price' ]}
                                                     }
                                                    },

                                                     {$match: {
                                                           discount: {$gt: 0}
                                                     }
                                                    },

                                                    {$sort: {discount: -1 }},

                                                    {$limit: 10}                                         
                                             
                                              ]);

            topThree = topThree.filter(product=>{
                                          
                                               return  !product.varient.inventory.every(s => s.stock < 1);
                                        })
                                        
                    topThree = topThree.slice(0,3)                 

          
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);                                    

      const coupon = await Coupon.find({isActive:true , coupon_type: 'common' , 

                                          $or : [                                       
                                                    {expiry_date:{ $gte: endOfToday}} ,
                                                    {expiry_date: { $exists:false}}, 
                                                    {expiry_date:null}
                                                ]
                                          })
                                         
     
      const user = await User.findById(req.session.user)         

     res.render('offers' , { topThree , coupon , user });

} catch(error){
       console.log("error in loading offers page" , error);
       res.redirect("/pageError")
}

} 




module.exports = {getOffer}