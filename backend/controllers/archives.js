import { logger } from "../log/logger.js";
import { Archive } from "../models/Archive.js";
import { User } from "../models/User.js";
import { School } from "../models/School.js";
import { Registration } from "../models/Registration.js";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import _ from "lodash";
import { PERMISSION_DENIED, __NOT_FOUND } from "../messages/index.js";

export const findByLabel = async (req, res) => {
  try {
    const archive = await Archive(req.user.academyId).findById(req.params._id);
    if (!archive) return res.status(404).send({});

    if (req.query?.label) {
      return res.status(200).send({
        archive: {
          data: { [req.query.label]: archive.data?.[req.query.label] },
        },
      });
    }
    return res.status(200).send({
      archive,
    });
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const findByRegistration = async (req, res) => {
  try {
    if (!("registration" in req.query)) return res.status(400).send({});

    if (!ObjectId.isValid(req.query.registration))
      return res.status(400).send({ message: "registration(oid) is invalid" });

    const _registration = await Registration(req.user.academyId).findById(
      req.query.registration
    );
    if (!_registration)
      return res.status(404).send({ message: "registration not found" });

    const user = _registration.user;
    const school = _registration.school;

    let archive = await Archive(req.user.academyId).findOne({
      user,
      school,
    });
    if (!archive) {
      const _user = await User(req.user.academyId).findById(user);
      if (!_user) return res.status(404).send({ message: "user not found" });

      const _school = await School(req.user.academyId).findById(school);
      if (!_school)
        return res.status(404).send({ message: "school not found" });

      archive = new (Archive(req.user.academyId))({
        user,
        userId: _user.userId,
        userName: _user.userName,
        school,
        schoolId: _school.schoolId,
        schoolName: _school.schoolName,
      });
      await archive.save();
    }

    return res.status(200).send({ archive: { _id: archive._id } });
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const find = async (req, res) => {
  try {
    let {
      user,
      school,
      registration,
      _id,
      registrationIds,
      label,
      registrationId,
    } = req.query;

    const _Archive = Archive(req.user.academyId);

    /* teacher request for students' archive */
    if (registrationIds && label) {
      const registrationIdList = _.split(registrationIds, ",");
      const registrations = await Promise.all(
        registrationIdList.map((_id) =>
          Registration(req.user.academyId).findById(_id).lean()
        )
      );
      const seasonIds = Array.from(
        new Set(
          registrations.map((registration) => registration.season.toString())
        )
      );
      if (seasonIds.length !== 1) {
        return res
          .status(409)
          .send({ message: "seasons of registrations not same" });
      }
      const teacherRegistration = await Registration(
        req.user.academyId
      ).findOne({
        season: seasonIds[0],
        user: req.user._id,
        role: "teacher",
      });
      if (!teacherRegistration) {
        return res
          .status(404)
          .send({ message: "teacher registration not found" });
      }

      const archives = [];
      for (let registration of registrations) {
        let archive = await Archive(req.user.academyId).findOne({
          school: registration.school,
          user: registration.user,
        });
        if (!archive) {
          archive = new _Archive({
            user: registration.user,
            userId: registration.userId,
            userName: registration.userName,
            school: registration.school,
            schoolId: registration.schoolId,
            schoolName: registration.schoolName,
          });
          await archive.save();
          archives.push({
            ...registration,
            ...archive.toObject(),
            data: { [label]: archive.data?.[label] },
          });
        } else
          archives.push({
            ...registration,
            ...archive.toObject(),
            data: { [label]: archive.data?.[label] },
          });
      }
      return res.status(200).send({ archives });
    }

    /* teacher or student request for archive */
    if (registrationId && label) {
      const studentRegistration = await Registration(
        req.user.academyId
      ).findById(registrationId);
      if (!studentRegistration) {
        return res.status(404).send({ message: "registration not found" });
      }

      const school = await School(req.user.academyId)
        .findById(studentRegistration.school)
        .lean()
        .select("formArchive");
      if (!school) return res.status(404).send({ message: "school not found" });

      const formArchiveItem = _.find(
        school.formArchive,
        (fa) => fa.label === req.query.label
      );
      if (!formArchiveItem)
        return res.status(404).send({ message: "formArchiveItem not found" });

      /* if it is student */
      if (studentRegistration.user.equals(req.user._id)) {
        if (formArchiveItem?.authStudent !== "view") {
          return res.status(403).send({});
        }
      } else if (formArchiveItem.authTeacher === "viewAndEditStudents") {
        /* if it is teacher */
        const teacherRegistration = await Registration(
          req.user.academyId
        ).findOne({
          season: studentRegistration.season,
          user: req.user._id,
          role: "teacher",
        });
        if (!teacherRegistration) return res.status(403).send({});
      } else if (formArchiveItem?.authTeacher === "viewAndEditMyStudents") {
        if (
          !studentRegistration.teacher?.equals(req.user._id) &&
          !studentRegistration.subTeacher?.equals(req.user._id)
        ) {
          return res.status(403).send({});
        }
      } else {
        return res.status(403).send({});
      }

      let archive = await Archive(req.user.academyId).findOne({
        school: studentRegistration.school,
        user: studentRegistration.user,
      });
      if (!archive) {
        archive = new _Archive({
          user: studentRegistration.user,
          userId: studentRegistration.userId,
          userName: studentRegistration.userName,
          school: studentRegistration.school,
          schoolId: studentRegistration.schoolId,
          schoolName: studentRegistration.schoolName,
        });
        await archive.save();

        return res.status(200).send({
          role: studentRegistration.role,
          grade: studentRegistration.grade,
          group: studentRegistration.group,
          ...archive.toObject(),
          data: { [label]: archive.data?.[label] },
        });
      }
      return res.status(200).send({
        role: studentRegistration.role,
        grade: studentRegistration.grade,
        group: studentRegistration.group,
        ...archive.toObject(),
        data: { [label]: archive.data?.[label] },
      });
    }

    if (_id) {
      const archive = await _Archive.findById(_id);
      if (!archive) return res.status(404).send({});
      return res.status(200).send({ archive });
    }

    if (registration) {
      if (!ObjectId.isValid(registration))
        return res
          .status(400)
          .send({ message: "registration(oid) is invalid" });

      const _registration = await Registration(req.user.academyId).findById(
        registration
      );
      if (!_registration)
        return res.status(404).send({ message: "registration not found" });

      user = _registration.user;
      school = _registration.school;
    }

    let archive = await _Archive.findOne({
      user,
      school,
    });
    if (!archive) {
      const _user = await User(req.user.academyId).findById(user);
      if (!_user) return res.status(404).send({ message: "user not found" });

      const _school = await School(req.user.academyId).findById(school);
      if (!_school)
        return res.status(404).send({ message: "school not found" });

      archive = new _Archive({
        user,
        userId: _user.userId,
        userName: _user.userName,
        school,
        schoolId: _school.schoolId,
        schoolName: _school.schoolName,
      });
      await archive.save();
    }

    return res.status(200).send({ archive });
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const updateBulk = async (req, res) => {
  try {
    /*

     label: string;
    archives: { _id: string; data: any }[];
    */
    if (!"label" in req.body || !"archives" in req.body) {
      return res
        .status(400)
        .send({ message: "label and archives are required in body" });
    }

    const archives = [];
    for (let _archive of req.body.archives) {
      if (!"_id" in _archive || !"data" in _archive) {
        return res
          .status(400)
          .send({ message: "_id and data are required in body" });
      }
      const archive = await Archive(req.user.academyId).findById(_archive._id);
      if (!archive)
        return res.status(404).send({ message: "archive not found" });

      archive.data = Object.assign(archive.data || {}, {
        [req.body.label]: _archive.data,
      });
      archives.push(archive);
    }

    await Promise.all(archives.map((archive) => archive.save()));
    return res.status(200).send({});
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params._id)) return res.status(400).send();
    for (let field of ["label", "data", "registration"]) {
      if (!(field in req.body)) {
        return res.status(400).send();
      }
    }

    const user = req.user;

    const archive = await Archive(req.user.academyId).findById(req.params._id);
    if (!archive) {
      return res.status(404).send({ message: __NOT_FOUND("archive") });
    }

    const school = await School(user.academyId).findById(archive.school);
    if (!school) {
      return res.status(404).send({ message: __NOT_FOUND("school") });
    }

    const formArchiveItem = _.find(
      school.formArchive,
      (fa) => fa.label === req.body.label
    );
    if (!formArchiveItem) {
      return res.status(404).send({ message: __NOT_FOUND("formArchive_Item") });
    }

    if (formArchiveItem.authTeacher === "viewAndEditStudents") {
      const studentRegistration = await Registration(user.academyId).findById(
        req.body.registration
      );

      if (!studentRegistration) {
        return res
          .status(404)
          .send({ message: __NOT_FOUND("registration(student)") });
      }

      const teacherRegistration = await Registration(user.academyId).findOne({
        season: studentRegistration.season,
        user: user._id,
        role: "teacher",
      });
      if (!teacherRegistration) {
        return res
          .status(404)
          .send({ message: __NOT_FOUND("registration(teacher)") });
      }
    } else if (formArchiveItem.authTeacher === "viewAndEditMyStudents") {
      const studentRegistration = await Registration(user.academyId).findById(
        req.body.registration
      );

      if (!studentRegistration) {
        return res
          .status(404)
          .send({ message: __NOT_FOUND("registration(student)") });
      }

      if (
        !studentRegistration.teacher?.equals(user._id) &&
        !studentRegistration.subTeacher?.equals(user._id)
      ) {
        return res.status(403).send({ message: PERMISSION_DENIED });
      }
    } else {
      return res.status(400).send({});
    }

    archive.data = {
      ...archive.data,
      [req.body.label]: req.body.data,
    };

    await archive.save();
    return res.status(200).send({
      archive: {
        _id: archive._id,
        user: archive.user,
        data: {
          [req.body.label]: archive.data[req.body.label],
        },
      },
    });
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};
