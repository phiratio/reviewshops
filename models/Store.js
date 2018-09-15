const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name!It is required.'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [
            {
                type: Number,
                required: 'You must supply coordinates'
            }
        ],
        address: {
            type: String,
            required: 'You must supply address'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//define our indexes
storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({location: '2dsphere'});

//no arrow func here because we need 'this'
storeSchema.pre('save', async function (next) {
    if (!this.isModified('name')) {
        next(); //skip it
        return; //stop this func from running
    }
    this.slug = slug(this.name);
    //find other stores that have a slug of wes, wes-1, wes-2
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({slug: slugRegEx});
    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
});

storeSchema.statics.getTagsList = function () { // proper function, we need 'this'
    return this.aggregate([
        {$unwind: '$tags'},
        {$group: {_id: '$tags', count: {$sum: 1}}},
        {$sort: {count: -1}}
    ]);
};
// aggregate is like query function.It returns a promise so we can await it
storeSchema.statics.getTopStores = function () {
    return this.aggregate([
// lookup Stores and populate their reviews; mongo db takes Review model, lowercase it and adds and s to the end >> reviews
        {$lookup: {from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews'}},
// filter for only items that have 2 or more reviews
        {$match: {'reviews.1': {$exists: true}}},// where the 2nd item exists in review
// add the average reviews field
        {
            $project: {
                photo: '$$ROOT.photo',
                name: '$$ROOT.name',
                reviews: '$$ROOT.reviews',
                slug: '$$ROOT.slug',
                averageRating: {$avg: '$reviews.rating'}
            }
        },
// sort it by our new field, highest reviews first
        {$sort: {averageRating: -1}},
// limit to at most 10
        {$limit: 10}
    ])
};

/*
by default virtual fields(they are mongoose "thing") do not go into object or json unless specificly asked
that's why they wont show in store.pug with pre= h.dump(store), that's why we define in the schema above
virtuals:true when parsing toJSON or toObject

find reviews where the stores _id property === reviews store prop
now we can populate reviews field too(in storeController)
*/
storeSchema.virtual('reviews', {
    ref: 'Review', // what model to link - the exports from Review.js
    localField: '_id', // which field on the store
    foreignField: 'store' // which field on the review
});

function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);