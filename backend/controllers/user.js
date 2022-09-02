const User = require("../models/User");
const SchoolUser = require("../models/SchoolUser");
const School = require("../models/School");
const { OAuth2Client } = require("google-auth-library");
const { checkSchema, validationResult } = require("express-validator");
const clientID = require("../config/config")["GOOGLE-ID"];
const saltRounds = require("../config/config")["saltRounds"];
const bcrypt = require("bcrypt");
const _ = require("lodash");
const Academy = require("../models/Academy");

const specialRegExp = /[!@#$%^&*()]+/;
const schemaOwner = {
    userId: {
        in: "body",
        isLength: {
            errorMessage: "ID length error",
            options: { min: 4, max: 20 }
        },
        isAlphanumeric: {
            errorMessage: "ID must be alphanumeric"
        }
    },
    userName: {
        in: "body",
        isLength: {
            errorMessage: "userName length error",
            options: { min: 2, max: 20 }
        }
    },
    email: {
        in: "body",
        trim: true,
        isEmail: {
            errorMessage: "invalid email"
        }
    }
};
const schemaMembers = {
    "users.*.userId": {
        in: "body",
        isLength: {
            errorMessage: "ID length error",
            options: { min: 4, max: 20 }
        },
        isAlphanumeric: {
            errorMessage: "ID must be alphanumeric"
        }
    },
    "users.*.userName": {
        in: "body",
        isLength: {
            errorMessage: "userName length error",
            options: { min: 2, max: 20 }
        }
    },
    "users.*.password": {
        in: "body",
        isLength: {
            errorMessage: "Password length error",
            options: { min: 8, max: 20 }
        },
        matches: {
            errorMessage: "Password must contain one special character",
            options: specialRegExp
        }
    },
    "users.*.email": {
        in: "body",
        trim: true,
        optional: true,
        isEmail: {
            errorMessage: "invalid email"
        }
    }
};
const schemaUpdate = {
    password: {
        in: "body",
        isLength: {
            errorMessage: "Password length error",
            options: { min: 8, max: 20 }
        },
        matches: {
            errorMessage: "Password must contain one special character",
            options: specialRegExp
        },
        optional: true
    },
    email: {
        in: "body",
        trim: true,
        isEmail: {
            errorMessage: "invalid email"
        },
        optional: true
    }
};

exports.validateOwner = checkSchema(schemaOwner);
exports.validateMembers = checkSchema(schemaMembers);
exports.validateUpdate = checkSchema(schemaUpdate);

const generateHash = async (password) => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (err) {
        throw err;
    }
};

exports.loginLocal = async (req, res) => {
    try {
        /* authentication */
        let dbName = "root";
        let academy = { academyId: "root", academyName: "root" };

        if (req.body.academyId) {
            const _academy = await Academy.findOne({
                academyId: req.body.academyId
            });
            if (!_academy) {
                return res.status(404).send({ message: "No Academy!" });
            }
            dbName = _academy.academyId + "-db";
            academy.academyId = _academy.academyId;
            academy.academyName = _academy.academyName;
        }

        const user = await User(dbName).findOne({ userId: req.body.userId });
        if (!user) {
            return res.status(409).send({ message: "No user with such ID" });
        }

        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) {
            return res.status(409).send({ message: "Password is incorrect" });
        }

        /* login */
        req.login({ user, dbName, academy }, (loginError) => {
            if (loginError)
                return res.status(500).send({ err: loginError.message });
            if (req.body.persist === "true") {
                req.session.cookie["maxAge"] = 365 * 24 * 60 * 60 * 1000; //1 year
            }
            return res.status(200).send({
                success: true,
                user: {
                    _id: user._id,
                    userId: user.userId,
                    userName: user.userName,
                    auth: user.auth
                }
            });
        });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.loginGoogle = async (req, res) => {
    try {
        let dbName = "root";
        let academy = { academyId: "root", academyName: "root" };
        if (req.body.academyId) {
            const _academy = await Academy.findOne({
                academyId: req.body.academyId
            });
            if (!_academy) {
                return res.status(404).send({ message: "No Academy!" });
            }
            dbName = _academy.academyId + "-db";
            academy.academyId = _academy.academyId;
            academy.academyName = _academy.academyName;
        }

        const client = new OAuth2Client(clientID);

        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: clientID
        });

        const payload = ticket.getPayload();
        const user = await User(dbName).findOne({
            "snsId.provider": "google",
            "snsId.email": payload["email"]
        });
        if (!user)
            return res.status(409).send({
                message: "User doesn't exists with such google account"
            });

        /* login */
        req.login({ user, dbName, academy }, (loginError) => {
            if (loginError) return res.status(500).send({ loginError });
            if (req.body.persist === "true") {
                req.session.cookie["maxAge"] = 365 * 24 * 60 * 60 * 1000; //1 year
            }
            return res.status(200).send({
                success: true,
                user: {
                    _id: user._id,
                    userId: user.userId,
                    userName: user.userName,
                    auth: user.auth
                }
            });
        });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.connectGoogle = async (req, res) => {
    try {
        const client = new OAuth2Client(clientID);

        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: clientID
        });

        const payload = ticket.getPayload();

        const user = await User(req.user.dbName).findOne({
            "snsId.provider": "google",
            "snsId.email": payload["email"]
        });
        if (user)
            return res.status(409).send({
                message: "This account is already in use"
            });

        const snsId = req.user["snsId"];
        if (!snsId.some((obj) => obj.provider === "google")) {
            snsId.push({ provider: "google", email: payload["email"] });
        } else {
            return res.status(409).send({
                message: "You already have a connected google account"
            });
        }
        await req.user.updateOne({ snsId });
        return res.status(200).send({
            user: {
                userId: req.user.userId,
                userName: req.user.userName,
                snsId: req.user.snsId
            }
        });
    } catch (err) {
        console.log(err);
        if (err) return res.status(500).send({ err: err.status });
    }
};

exports.disconnectGoogle = async (req, res) => {
    try {
        const snsId = req.user["snsId"];
        const idx = snsId.findIndex((obj) => obj.provider === "google");
        if (idx == -1) {
            return res.status(409).send({
                message: "no google account connected to this account"
            });
        }
        req.user["snsId"].splice(idx, 1);
        await req.user.updateOne({ snsId });
        return res.status(200).send({
            user: {
                userId: req.user.userId,
                userName: req.user.userName,
                snsId: req.user.snsId
            }
        });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).send({ err });
        req.session.destroy();
        res.clearCookie("connect.sid");
        return res.status(200).send({ success: true });
    });
};

exports.createOwner = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const _User = User("root");
        const exUser = await _User.findOne({ userId: req.body.userId });
        if (exUser)
            return res.status(409).send({
                message: `userId '${req.body.userId}' is already in use`
            });

        // generate random password
        var chars =
            "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let password = "";
        for (var i = 0; i < 12; i++) {
            var randomNumber = Math.floor(Math.random() * chars.length);
            password += chars[randomNumber];
        }

        const user = new _User(req.body);
        user.auth = "owner";
        user.password = password;

        await user.save();
        return res.status(200).send({
            success: true,
            user: {
                _id: user._id,
                userId: user.userId,
                userName: user.userName,
                password: password,
                auth: user.auth
            }
        });
    } catch (err) {
        return res.status(500).send({ err: err.message });
    }
};

exports.enterMembers = async (req, res) => {
    try {
        const school = await School(req.user.dbName).findOne({
            schoolId: req.body.schoolId,
            schoolName: req.body.schoolName
        });
        if (!school) {
            return res.status(404).send({ message: "no school!" });
        }

        const _userIds = (
            await SchoolUser(req.user.dbName).find({
                schoolId: school.schoolId
            })
        ).map((_schoolUser) => _schoolUser.userId);
        const schoolUsers = [];
        const users = [];

        for (let _user of req.body.users) {
            // userId 중복 검사
            const user = await User(req.user.dbName).findOne({
                userId: _user.userId,
                userName: _user.userName
            });
            if (!user) {
                return res
                    .status(404)
                    .send({ message: `no user ${_user.userId}` });
            }

            if (
                _.findIndex(user.schools, {
                    schoolId: school.schoolId,
                    schoolName: school.schoolName
                }) !== -1
            ) {
                return res.status(409).send({
                    message: `user ${_user.userId} is already entered`
                });
            }

            user.schools.push({
                schoolId: school.schoolId,
                schoolName: school.schoolName
            });
            users.push(user);

            const schoolUser = {
                schoolId: school.schoolId,
                schoolName: school.schoolName,
                userId: _user.userId,
                userName: _user.userName,
                role: _user.role,
                info: _user.info
            };
            schoolUsers.push(schoolUser);
        }

        const [newUsers, newSchoolUsers] = await Promise.all([
            users.map((user) => {
                user.save();
            }),
            SchoolUser(req.user.dbName).insertMany(schoolUsers)
        ]);
        return res.status(200).send({ schoolUsers: newSchoolUsers });
    } catch (err) {
        return res.status(500).send({ err: err.message });
    }
};

exports.createMembers = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        // db의 userId 목록
        const _userIds = (await User(req.user.dbName).find({})).map(
            (_user) => _user.userId
        );
        const users = [];
        const schoolUsers = [];

        for (let _user of req.body.users) {
            // userId 중복 검사
            if (_userIds.includes(_user.userId)) {
                return res
                    .status(409)
                    .send({ message: "duplicate userId " + _user.userId });
            }
            const user = {
                userId: _user.userId,
                userName: _user.userName,
                password: await generateHash(_user.password),
                auth: "member",
                email: _user.email,
                tel: _user.tel
            };
            if (!_user.schoolId) {
                users.push(user);
                continue;
            }

            user["schools"] = [
                {
                    schoolId: _user.schoolId,
                    schoolName: _user.schoolName
                }
            ];
            users.push(user);

            const schoolUser = {
                schoolId: _user.schoolId,
                schoolName: _user.schoolName,
                userId: _user.userId,
                userName: _user.userName,
                role: _user.role,
                info: _user.info
            };
            schoolUsers.push(schoolUser);
        }

        const [newUsers, newSchoolUsers] = await Promise.all([
            User(req.user.dbName).insertMany(users),
            SchoolUser(req.user.dbName).insertMany(schoolUsers)
        ]);
        return res
            .status(200)
            .send({ users: newUsers, schoolUsers: newSchoolUsers });
    } catch (err) {
        return res.status(500).send({ err: err.message });
    }
};

exports.appointManager = async (req, res) => {
    try {
        const user = await User(req.user.dbName).findOne({
            _id: req.params._id
        });
        if (!user) {
            return res.status(409).send({ message: "no such user!" });
        }
        if (user.auth != "member") {
            return res
                .status(401)
                .send({ message: "you can't appoint user as manager" });
        }

        user.auth = "manager";
        await user.save();

        return res.status(200).send({
            success: true,
            user: {
                _id: user._id,
                userId: user.userId,
                userName: user.userName,
                auth: user.auth
            }
        });
    } catch (err) {
        return res.status(500).send({ err: err.message });
    }
};

exports.cancelManager = async (req, res) => {
    try {
        const user = await User(req.user.dbName).findOne({
            _id: req.params._id
        });
        if (!user) {
            return res.status(409).send({ message: "no such user!" });
        }
        if (user.auth != "manager") {
            return res
                .status(401)
                .send({ message: "you can't appoint user as member" });
        }

        user.auth = "member";
        await user.save();

        return res.status(200).send({
            success: true,
            user: {
                _id: user._id,
                userId: user.userId,
                userName: user.userName,
                auth: user.auth
            }
        });
    } catch (err) {
        return res.status(500).send({ err: err.message });
    }
};

exports.readOwners = async (req, res) => {
    try {
        const users = await User(req.user.dbName).find({});
        return res.status(200).send({
            users: users.map((user) => {
                user.password = undefined;
                return user;
            })
        });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.readAdmin = async (req, res) => {
    try {
        let dbName = req.query.academyId + "-db";
        console.log("dbName: ", dbName);
        const user = await User(dbName).findOne({ userId: req.query.userId });
        dbName["password"] = undefined;
        return res.status(200).send({ user });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.readMembers = async (req, res) => {
    try {
        const users = await User(req.user.dbName).find({});
        return res.status(200).send({
            users: users.map((user) => {
                user.password = undefined;
                return user;
            })
        });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.updateAdmin = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User("root").find({
            _id: req.params._id,
            auth: "admin"
        });
        if (!user) {
            return res.status(409).send({ message: "no user with such _id" });
        }
        const fields = ["password", "email", "tel"];
        if (fields.includes(req.params.field)) {
            user[req.params.field] = req.body[req.params.field];
        } else {
            return res.status(400).send({
                message: `field '${req.params.field}' does not exist or cannot be updated`
            });
        }
        await user.save();
        return res.status(200).send({ user });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.updateMemberField = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User(req.user.dbName).findById(req.params._id);
        if (!user) {
            return res.status(409).send({ message: "no user with such _id" });
        }

        if (user.auth != "member") {
            return res
                .status(401)
                .send({ message: "you cannot update this user" });
        }

        const fields = ["password", "email", "tel"];
        if (fields.includes(req.params.field)) {
            user[req.params.field] = req.body.new;
        } else {
            return res.status(400).send({
                message: `field '${req.params.field}' does not exist or cannot be updated`
            });
        }
        await user.save();
        return res.status(200).send({ user });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.read = async (req, res) => {
    try {
        const user = req.user;
        const schoolUsers = await Promise.all(
            user.schools.map(async (school) => {
                const schoolUser = await SchoolUser(req.user.dbName).findOne({
                    userId: user.userId,
                    schoolId: school.schoolId
                });
                return schoolUser;
            })
        );
        res.status(200).send({
            user: {
                ...user["_doc"],
                academyId: req.user.academy.academyId,
                academyName: req.user.academy.academyName
            },
            schoolUsers
        });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.updateField = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = req.user;
        const fields = ["password", "email", "tel"];
        if (!fields.includes(req.params.field)) {
            return res.status(400).send({
                message: `field '${req.params.field}' does not exist or cannot be updated`
            });
        }

        user[req.params.field] = req.body.new;
        await user.save();
        return res.status(200).send({ user });
    } catch (err) {
        if (err) return res.status(500).send({ err: err.message });
    }
};

exports.deleteMember = async (req, res) => {
    try {
        const doc = await User(req.user.dbName).findByIdAndDelete({
            _id: req.params._id,
            auth: "member"
        });
        return res.status(200).send({ success: !!doc });
    } catch (err) {
        return res.status(500).send({ err: err.message });
    }
};
