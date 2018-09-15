const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', {title: 'Login Form'});
};

exports.registerForm = (req, res) => {
    res.render('register', {title: 'Register'});
};

exports.validateRegister = (req, res, next) => {
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply name').notEmpty();
    req.checkBody('email', 'that email is not valid').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false,
    });
    req.checkBody('password', 'password cannot be blank').notEmpty();
    req.checkBody('password-confirm', 'password confirm cannot be blank').notEmpty();
    req.checkBody('password-confirm', 'passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();
    if (errors) {
        req.flash('error', errors.map(err => err.msg));
        res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
        return; // stop the fn from running
    }
    next() // there were no errors!
};

exports.register = async (req, res, next) => {
    const user = new User({email: req.body.email, name: req.body.name});
    // register wil take the password and hash it (from the passportlocalmongoose)
    const registerWithPromise = promisify(User.register, User);
    await registerWithPromise(user, req.body.password);
    next(); // pass to authcontroller.login
};

exports.account = (req, res) => {
    res.render('account', {title: 'Edit your account'});
};

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
        {_id: req.user._id}, // thats the query
        {$set: updates}, // the update
        {new: true, runValidators: true, context: 'query'} // extra options
    );
    req.flash('success', 'Updated the profile');
    res.redirect('back');

};