
const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");


const getAddress = async (req,res)=>{
    try {

    const user = req.session.user;

     const userData = await User.findById(user)

      const [firstName = "" ,middleName = "", lastName = "" ] = (user.name || "" ).split(' ')
 
     const address = await Address.find({user_id:user})

        
        res.render("address",{layout:"../layout/userAccount", active:"address" ,user:userData , addresses:address ,firstName,lastName})
    } catch (error) {
        console.log("failed to load address page",error)
        res.render('/pageNotFound')
    }
}

const addAddress = async (req,res)=>{
      try {
          
        const userId = req.session.user;

        const addressDetails = req.body;

         addressDetails.makeDefault = !!req.body.makeDefault;


        console.log("adddresss",addressDetails)

        const address = await new Address({
             user_id:userId,
             isDefault: addressDetails.makeDefault,
             name:addressDetails.fullName,
             address_name:addressDetails.address_name,
             locality:addressDetails.locality,
             city: addressDetails.cityDistrict,
             landmark: addressDetails.landmark || '',
             state: addressDetails.stateRegion,
             pin_code:addressDetails.pinCode,
             address_type: addressDetails.address_type,
             phone_number: addressDetails.mobileNumber  ,
             alternate_phone_number: addressDetails.altMobileNumber ,
         

        })  

        await address.save();

  

        await User.findByIdAndUpdate(userId,{address:address._id})
   
        res.redirect("/address");


      } catch (error) {
        console.log("error in adding address",error)
        res.redirect("/pageError")
      }
}

const editAddress = async (req,res)=>{
  try {
     const addressId = req.body.addressId;

      const editedDetails = req.body;



      await Address.findByIdAndUpdate(addressId, editedDetails , {new:true});

      res.redirect('/address')



  } catch (error) {
     console.log("unable to edit address",error);
     res.redirect('/pageNotFound')
  }
}

const deleteAddress = async (req,res)=> {
  try {
     const addressId = req.params.id;
        
     await Address.findByIdAndDelete(addressId);
    
     res.redirect("/address")


  } catch (error) {
     console.log("error in deleting address",error);
     res.redirect("/pageNotFound")
  }
}

const setDefault = async (req, res) => {

        const selectedAddressId = req.params.id;
         const userId = req.session.user;

     try {

      
   
        await Address.updateMany({ user_id: userId }, { $set: { isDefault: false } });

   
       await Address.findByIdAndUpdate(selectedAddressId, { $set: { isDefault: true } });

      res.redirect('/address');

  } catch (err) {
    console.error("Error setting default address:", err);
    res.status(500).redirect("/pageError");
  }
}


const addAddressCheckout = async (req,res)=>{
  try {
     const addressId = req.body.addressId;

      const details = req.body;
     
      const userId = req.session.user;

       details.user_id = userId;

      await new Address(details).save();

      res.redirect('/checkout')

  
  } catch (error) {
     console.log("unable to edit address",error);
     res.redirect('/pageNotFound')
  }
}


const editAddressCheckout = async (req,res)=>{
  try {
     const addressId = req.body.addressId;

      const editedDetails = req.body;



      await Address.findByIdAndUpdate(addressId, editedDetails , {new:true});

      res.redirect('/checkout')



  } catch (error) {
     console.log("unable to edit address",error);
     res.redirect('/pageNotFound')
  }
}


module.exports= { getAddress , addAddress , editAddress, deleteAddress , setDefault , addAddressCheckout , editAddressCheckout}