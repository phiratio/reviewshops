const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed login',
    successRedirect: '/',
    successFlash: 'You are now loggedin '
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are logged out now.');
    res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    // check if the user is auth'd
    if (req.isAuthenticated()) {
        next(); // carry on they are logged in
        return;
    }
    req.flash('error', 'Login in first');
    res.redirect('/login');
};

exports.forgot = async (req, res) => {
    // see if a user with that email exists
    const user = await User.findOne({email: req.body.email});
    if (!user) {
        req.flash('error', 'No account with that mail');
        return res.redirect('/login');
    }
    // set reset tokens and expiry on their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();
    // send them an email with the token
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

    await mail.send({
        user,
        filename: 'password-reset',
        subject: 'Password reset',
        resetURL
    });
    req.flash('success', `Emailed the reset link.`);
    // redirect to login page
    res.redirect('/login');
};

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    });
    if (!user) {
        req.flash('error', 'invalid or expired token');
        return res.redirect('/login');
    }
    // if there is a user, show the reset password form
    console.log(user);
    res.render('reset', {title: 'reset your password'});
};

exports.confirmedPasswords = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        next(); // keep it going
        return;
    }
    req.flash('error', 'passwords dont match');
    res.redirect('back');
};

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    });
    if (!user) {
        req.flash('error', 'invalid or expired token');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser); // from passportjs
    req.flash('success', 'password reset success');
    res.redirect('/');

};