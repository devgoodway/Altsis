const mongoose = require('mongoose')
const moment = require('moment');
const { conn } = require('../databases/connection')

var syllabusSchema =  mongoose.Schema({
    _id:String,
    schoolId:String,
    schoolName:String,
    year:String,
    term:String,
    classTitle:String,
    time:String,
    point:Number,
    subject:Array
},{_id:false});


const enrollmentSchema = mongoose.Schema({
    userId: String,
    userName:String,
    schoolId:String,
    year:String,
    term:String,
    syllabus:syllabusSchema,
    evaluation:Object
},{ timestamps: true });

module.exports = (dbName) => {
    return conn[dbName].model('Enrollment', enrollmentSchema);
}