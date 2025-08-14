
const User = require("../../models/userSchema")
const env = require("dotenv").config();
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const session = require("express-session")
const Address = require("../../models/addressSchema")


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
    try {

        const transporter = nodemailer.createTransport({

            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({

            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Recover your Accound for Petal & Mist",
            text: `Your OTP is ${otp}`,
            html: `<b> Your OTP ${otp} <b>`,

        })

        return info.accepted.length > 0

    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}


const loadPasswordReset = async (req, res) => {

    try {

        res.render("forgotPassword", { message: "" })

    } catch (error) {
        console.log(error)
        res.redirect("/account")
    }
}


const resetPassword = async (req, res) => {

    try {

        const { email } = req.body;

        const user = await User.findOne({ email })


        if (user) {
            const otp = generateOtp();
            const otpExpiry = Date.now() + 60 * 1000; // 1 minute expiry

            const emailSent = await sendVerificationEmail(email, otp)

            req.session.userOtp = otp;
            req.session.otpExpiry = otpExpiry;
            req.session.email = email

            console.log("otp send", otp)

            if (emailSent) {

                res.render("otpForgotPassword")


            } else {
                res.json({ success: false, message: "Failed to send otp. Please try again" })
            }
        }
        else {
            return res.render("forgotPassword", { message: "user not found" })
        }

    } catch (error) {

        console.log(error)
        res.redirect("/account")

    }

}


const verifyOtp = async (req, res) => {

    try {

        const { enteredOtp } = (req.body);
        const otp = req.session.userOtp;
        const email = req.session.email;
        const otpExpiry = req.session.otpExpiry


        if (!otp || !email) {
            return res.render("forgotPassword", { message: "session expired" })
        }

        if (Date.now() > otpExpiry) {
            return res.status(400).json({ success: false, message: "OTP expired. Please resend OTP." });
        }

        if (otp !== enteredOtp) {
            return res.status(400).json({ success: false, message: "otp donot match" })
        }

        res.status(200).json({ success: true, message: "otp verification sucessfull" })


    } catch (error) {
        console.log(error)
        res.redirect("/pageError")
    }
}

const resendOtp = async (req, res) => {

    try {
        if (!req.session.email) {
            return res.render("forgotPassword", { message: "session expired" })
        }

        const email = req.session.email;

        const otp = generateOtp();
        const otpExpiry = Date.now() + 60 * 1000;
        const emailSent = await emailVerificationOtp(email, otp)


        if (emailSent) {

            req.session.userOtp = otp;
            req.session.otpExpiry = otpExpiry;

            res.status(200).json({ success: true, message: "OTP send sucessfully" })

        }
    }
    catch (error) {
        res.status(500).json({ sucess: false, message: "Unable to send OTP , please try again" })
        console.log("otp send failed", error)
    }

}


const newPasswordPage = async (req, res) => {

    res.render("resetPassword", { message: "" })

}


const SaveNewPassword = async (req, res) => {
    try {
        const { password, cPassword } = req.body;
        const email = req.session.email;

        if (!email) {
            return res.render("forgotPassword", { message: "session expired" })
        }

        if (password !== cPassword) {
            return res.render("resetPassword", { message: "Passwords do not match" });
        }

        const saltRounds = 10;

        const hashedPassword = await bcrypt.hash(password, saltRounds)


        const updateUser = await User.findOneAndUpdate({ email }, { $set: { password: hashedPassword } }, { new: true })

        if (!updateUser) {
            return res.render("forgotPassword", { message: "Unable to reset password" });
        }

        return res.render("login", { message: "Password updated successfully", activeTab: "login" });

    }
    catch (error) {
        console.error("Password reset error:", error);
        return res.status(500).render("resetPassword", { message: "Server error. Please try again." });
    }

}

const loadAccount = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect("/login")
        }
        const user = await User.findOne({ _id: req.session.user })



        if (!user) {
            return res.redirect("/login")
        } else {


            const [firstName = "", middleName = "", lastName = ""] = (user.name || "").split(' ')

            res.render("account", { layout: "../layout/userAccount", active: "account", user, firstName, middleName, lastName })
        }

    } catch (error) {

        res.status(500).redirect("/pageError")
        console.log("error in loading profile", error)

    }

}


const editAccount = async (req, res) => {

    try {

        const email = req.session.email;
        if (!email) return res.redirect("/login");

        const user = await User.findOne({ email });
        if (!user) return res.redirect("/login");

        const { firstName, lastName, } = req.body;
        const editedDetails = req.body;

        editedDetails.name = String(firstName + ' ' + lastName)

        let updatedFields = {};

        for (let key in editedDetails) {

            if (editedDetails[key] && editedDetails[key] !== JSON.stringify(user[key])) {

                updatedFields[key] = editedDetails[key];

            }
        }

        if (req.file) {
            newPath = '/uploads/path/' + req.file.filename;
            if (user.profileImage !== newPath) {
                updatedFields.profileImage = '/uploads/images/' + req.file.filename

            }

        }

        await User.findByIdAndUpdate(user._id, updatedFields, { new: true })

        res.redirect('/account');

    } catch (error) {
        console.error(error);
        res.status(500).redirect("/pageError")
    }

}

async function emailVerificationOtp(email, otp) {
    try {

        const transporter = nodemailer.createTransport({

            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({

            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Add this email for Accound in Petal & Mist",
            text: `Your OTP is ${otp}`,
            html: `<b> Your OTP ${otp} <b>`,

        })

        return info.accepted.length > 0

    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}

const changeEmail = async (req, res) => {
    try {

        const user = req.session.user;
        const email = req.body.email;
        req.session.email = email;


        const existingEmail = await User.findOne({ email })

        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }



        if (user) {
            const otp = generateOtp();
            const otpExpiry = Date.now() + 60 * 2000; // 2 minute expiry
            const emailSent = await emailVerificationOtp(email, otp)

            req.session.userOtp = otp;

            if (emailSent) {

                req.session.userOtp = otp;
                req.session.otpExpiry = otpExpiry;


            } else {
                res.status(400).json({ success: false, message: "failed to send otp, please try again" })
            }

            res.status(200).json({ success: true, message: "Sucess" })

        } else {
            res.status(400).json({ success: false, message: "session expired , please log in again" })
        }


    } catch (error) {
        console.log("failed to send otp to email", error)
        res.status(400).json({ success: false, message: "unable to send otp , please log in again" })

    }
}


const loadEmailOtp = async (req, res) => {
    try {

        res.render("changeEmailOtp");

    } catch (error) {
        console.log("failed to load otp email page", error)
    }
}


const verifyChangeEmail = async (req, res) => {
    try {
        const enteredOtp = req.body.otp
        const email = req.session.email
        const otp = req.session.userOtp
        const otpExpiry = req.session.otpExpiry

        if (!otp || !email) {

            return res.render("account", { message: "session expired" })
        }

        if (Date.now() > otpExpiry) {

            return res.status(400).json({ success: false, message: "OTP expired. Please resend OTP." });
        }

        if (otp !== enteredOtp) {

            return res.status(400).json({ success: false, message: "otp donot match" })
        }

        return res.status(200).json({ success: true, message: "otp verification sucessfull" })

    } catch (error) {

        res.status(500).json({ success: false, message: "unable to change the email" });

    }
}

const saveNewEmail = async (req, res) => {
    try {
        const email = req.session.email;
        const userId = req.session.user;

        if (userId && email) {

            await User.findByIdAndUpdate(userId, { email });

            res.redirect('/account')

        } else {
            res.status(400).json({ message: "Unable to change email" })
        }


    } catch (error) {

        console.log("unable to change email", error)
        res.status(500).json({ success: false, message: "server error in changing Email" + error.message });

    }
}


const changePassword = async (req, res) => {
    try {

        const userId = req.session.user
        const user = await User.findById(userId)

        const { currentPassword, newPassword, confirmPassword } = req.body;

        const pmatch = await bcrypt.compare(currentPassword, user.password)

        if (!pmatch) {

            return res.status(400).json({ message: "Inavlid password" })

        } else if (newPassword !== confirmPassword) {

            return res.status(400).json({ message: "Password do not match" })
        }


        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
        user.password = hashedPassword;

        await user.save();

        res.status(200).json({ message: "password changed sucessfully" })


    } catch (error) {
        console.log("error in changing password", error);
        res.status(400).json({ message: "Server Error" })

    }
}


//  rzp_test_mAfXiHc8Pp0GEC



module.exports = {
    loadPasswordReset,
    resetPassword,
    verifyOtp,
    SaveNewPassword,
    loadAccount,
    editAccount,
    resendOtp,
    newPasswordPage,
    changeEmail,
    verifyChangeEmail,
    saveNewEmail,
    changePassword,
    loadEmailOtp
}