const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp'); // for image resize
const uuid = require('uuid'); // for unique identifier for every uploaded image


const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true); //null here is the error i.e. it's fine continue
        } else {
            next({message: 'That filetype is not allowed!'}, false);
        }
    }
};
/*exports.myMiddleware = (req, res, next) => {
    req.name = 'bob';
    res.cookie('name', 'bob is cool', {maxAge: 900000});
    if(req.name === 'bob') {
      throw Error('Thats a very stupid name bro');
    };
    next();
};*/

exports.homePage = (req, res) => {
    //console.log(`${req.name} accessed the \/`);
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
};

exports.upload = multer(multerOptions).single('photo');//stores the file in the memory

exports.resize = async (req, res, next) => {
    // check if there is no new file to resize
    if (!req.file) {
        next(); //skip to the next middleware > createStore
        return;
    }
    //console.log(req.file);
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // now we resize
    const photo = await jimp.read(req.file.buffer); // file path or buffer(photo is currently in memory)
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // once written to filesystem keep going
    next();
};

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    console.log(`Store created. \nDetails: ${JSON.stringify(req.body)}`);
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully created ${store.name}.`);
    res.redirect(`/store/${store.slug}`);
    //res.json(req.body);
};

exports.getStores = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;
    //1. Query the database for list of all stores
    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({created: 'desc'});
    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);
    const pages = Math.ceil(count / limit);
    if (!stores.length && skip) {
        req.flash('info', `page ${page} not exists you've been redirected to last page / ${pages} /`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }
    res.render('stores', {title: 'Stores', stores, page, pages, count});
};

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw  Error('You must own a store in order to edit it')
    }
};

exports.editStore = async (req, res) => {
    //1. Find the store given the ID
    const store = await Store.findOne({_id: req.params.id});
    //2. Config they are the owner of the store
    confirmOwner(store, req.user);
    //3. Render out the edit form so the user can update their store
    res.render('editStore', {title: 'Edit Store', store})
};

exports.updateStore = async (req, res) => {
    // set the location data to be point
    req.body.location.type = 'Point';
    // find and update the store
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true, // return the new store instead of the old one(the store const
        runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong></strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
    // redirect them to the store and tell it worked
};

exports.getStoreBySlug = async (req, res, next) => {
    //res.json(req.params)
    const store = await Store.findOne({
        slug: req.params.slug // comes from the route in index.js
    }).populate('author reviews'); // will replace the author id with the whole author info from the db
    if (!store) return next();
    res.render('store', {store, title: store.name});
};

exports.getStoresByTag = async (req, res, next) => {
    const tag = req.params.tag;
    const tagQuery = tag || {$exists: true};
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({tags: tagQuery});
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    //res.json(result);
    res.render('tag', {tags, title: 'Tags', tag, stores});
};

exports.searchStores = async (req, res) => {
    const stores = await Store
    // first find stores that match
        .find({
            $text: {
                $search: req.query.q,
            }
        }, {
            score: {$meta: 'textScore'}
        })
        // then sort them
        .sort({
            score: {$meta: 'textScore'}
        })
        //limit to only 5 results
        .limit(5);
    res.json(stores);
};

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000 // 10km
            }
        }
    };

    // you chain which fields do you want from the query with select( field1 field2)
    // you can use - to say give me all values except that select( -field1 -field2)
    const stores = await Store.find(q).select('').limit(50);
    res.json(stores)
};

exports.mapPage = (req, res) => {
    res.render('map', {title: 'Map'});
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User.findByIdAndUpdate(req.user._id,
        {[operator]: {hearts: req.params.id}},
        {new: true}
    );
    res.json(user);
};

exports.getHearts = async (req, res) => {
    const stores = await Store.find({
        // where _id of the store is in req.user.hearts(array)
        _id: {$in: req.user.hearts}
    });
    res.render('stores', {title: "Hearted Stores", stores});
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    //res.json(stores);
    res.render('topStores', {stores, title: '✭ Top stores ✭'})
};