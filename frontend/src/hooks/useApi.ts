/**
 * @file useApi hook
 *
 * database api hook using useDatabase
 *
 * @author seedlessapple <luminousseedlessapple@gmail.com>
 *
 * -------------------------------------------------------
 *
 * IN PRODUCTION
 * - useApi hook
 *
 * -------------------------------------------------------
 *
 * IN MAINTENANCE
 *
 * -------------------------------------------------------
 *
 * IN DEVELOPMENT
 *
 * -------------------------------------------------------
 *
 * DEPRECATED
 *
 * -------------------------------------------------------
 *
 * NOTES
 *
 */

import useDatabase from "hooks/useDatabase";
export default function useApi() {
  const database = useDatabase();

  /**
   * API FUNCTIONS
   */
  function QUERY_BUILDER(params?: object) {
    let query = "";
    if (params) {
      query = "?";
      for (const [key, value] of Object.entries(params)) {
        query = query.concat(`${key}=${value}&`);
      }
    }
    return query;
  }

  /**
   * Academy Api
   * ##########################################################################
   */

  /**
   * Get Academies
   * @type GET
   * @auth guest
   * @returns list of academies
   */
  async function RAcademies() {
    const { academies: result } = await database.R({ location: "academies" });
    return result;
  }
  /**
   * Update Subjects in school
   * @auth admin
   */
  async function USchoolSubject(props: {
    academyId: string;
    schoolId: string;
    data: any;
  }) {
    return await database.U({
      location: `academies/${props.academyId}/schools/${props.schoolId}/subjects`,
      data: { new: props.data },
    });
  }
  /**
   * User Api
   * ##########################################################################
   */
  /**
   * local login
   * @type POST
   * @auth guest
   */
  async function CLoginLocal(data: {
    academyId: string;
    userId: string;
    password: string;
    persist?: boolean;
  }) {
    return await database.C({ location: "users/login/local", data: data });
  }

  /**
   * Google login
   * @type POST
   * @auth member
   */
  async function CGoogleLocal(data: {
    academyId: string;
    credential: string;
    persist?: boolean;
  }) {
    return await database.C({ location: "users/login/google", data: data });
  }
  /**
   * Google login
   * @type POST
   * @auth member
   */
  async function DGoogleLocal() {
    return await database.D({ location: "users/google" });
  }

  /**
   * Connect Google login to user
   * @type POST
   * @auth member
   */
  async function CConnectGoogle(data: {
    academyId: string;
    credential: string;
    persist?: boolean;
  }) {
    return await database.C({ location: "users/login/google", data: data });
  }

  /**
   * Get user Logged In
   * @type GET
   * @auth member
   * @returns LoggedIn User
   */
  async function RMySelf() {
    const result = await database.R({ location: "users/current" });
    return result;
  }

  /**
   * Logout user
   * @type GET
   * @auth member
   * @returns Logout user
   */
  async function RLogout() {
    const result = await database.R({ location: "users/logout" });
    return result;
  }
  /**
   * Season Api
   * ##########################################################################
   */

  /**
   * Get Season by Id
   * @type GET
   * @auth member
   * @returns Season
   */
  async function RSeason(id: string) {
    const result = await database.R({ location: `seasons/${id}` });
    return result;
  }

  /**
   * Registration Api
   * ##########################################################################
   */
  /**
   * Get Registration by param
   * @type GET
   * @auth member
   * @returns Registrations
   */
  async function RRegistrations(params?: {
    season?: string;
    schoolId?: string;
    schoolName?: string;
    year?: string;
    term?: string;
    userId?: string;
    userName?: string;
    role?: "student" | "teacher";
  }) {
    const { registrations: result } = await database.R({
      location: `registrations${QUERY_BUILDER(params)}`,
    });
    return result;
  }
  /**
   * Form Api
   * ##########################################################################
   */

  /**
   * Create Form
   * @type POST
   * @auth admin
   * @returns Created Form
   */
  async function CForm(data: {
    type: "syllabus" | "timetable" | "evaluation" | "archive";
    title: string;
    data: any[];
  }) {
    const result = await database.R({ location: "users/logout" });
    return result;
  }

  /**
   * Read Forms
   * @type GET
   * @auth admin
   * @returns Form list ([data]Field omitted)
   */
  async function RForms(params?: {
    userId?: string;
    userName?: string;
    type?: "syllabus" | "timetable" | "evaluation" | "archive";
    title?: string;
  }) {
    const { forms: result } = await database.R({
      location: "forms" + QUERY_BUILDER(params),
    });
    return result;
  }
  /**
   * Read Form by id
   * @type GET
   * @auth admin
   * @returns Form
   */
  async function RForm(id: string) {
    const result = await database.R({ location: "forms/" + id });
    return result;
  }
  /**
   * School Api
   * ##########################################################################
   */

  /**
   * Create School
   * @auth admin
   */
  async function CSchools(data: { schoolId: string; schoolName: string }) {
    return await database.C({ location: "schools", data: data });
  }
  /**
   * Read Schools
   * @auth admin
   */
  async function RSchools() {
    return await database.R({ location: "schools" });
  }
  /**
   * Read Schools by id
   * @auth member
   */
  async function RSchool(id: string) {
    return await database.R({ location: "schools/" + id });
  }
  /**
   * Update Classrooms in school
   * @auth admin
   */
  async function USchoolClassroom(props: {
    academyId: string;
    schoolId: string;
    data: any;
  }) {
    return await database.U({
      location: `academies/${props.academyId}/schools/${props.schoolId}/classrooms`,
      data: { new: props.data },
    });
  }

  /**
   * Update formArchive in school
   * @auth admin
   */
  async function USchoolFormArchive(props: { schoolId: string; data: any }) {
    return await database.U({
      location: `schools/${props.schoolId}/form/archive`,
      data: { new: props.data },
    });
  }
  /**
   * Enrollment Api
   * ##########################################################################
   */

  /**
   * Read Enrollments
   * @type GET
   * @auth member
   * @returns Enrollments
   */
  async function REnrolllments(params?: {
    syllabus?: string;
    season?: string;
    studentId?: string | number;
  }) {
    const { enrollments } = await database.R({
      location: "enrollments" + QUERY_BUILDER(params),
    });
    return enrollments;
  }

  /**
   * Read Enrollment
   * @type GET
   * @auth member
   * @returns Enrollment
   */
  async function REnrolllment(id: string) {
    const result = await database.R({
      location: "enrollments" + id,
    });
    return result;
  }

  /**
   * Archive Api
   * ##########################################################################
   */
  /**
   * Read Archives
   * @type GET
   * @auth admin
   * @returns Archives
   */
  async function RArchives(params: {
    school?: string;
    userId?: string | number;
  }) {
    const result = await database.R({
      location: "archives" + QUERY_BUILDER(params),
    });
    return result;
  }
  /**
   * Update Archives
   * @type PUT
   * @auth admin
   * @returns Archives
   */
  async function UArchives(params: {
    school?: string;
    userId?: string | number;
  }) {
    const result = await database.R({
      location: "archives" + QUERY_BUILDER(params),
    });
    return result;
  }

  /**
   * Notification Api
   * ##########################################################################
   */
  async function CUpdatedNotifications(userId: string) {
    const { notifications } = await database.R({
      location: `notifications?type=received&userId=${userId}&checked=false&updated=true`,
    });
    return notifications;
  }
  async function UCheckNotification(_id: string) {
    const res = await database.U({
      location: `notifications/${_id}/check`,
      data: {},
    });
    return res;
  }

  return {
    AcademyApi: {
      RAcademies,
      USchoolSubject,
    },
    UserApi: {
      CLoginLocal,
      RMySelf,
      RLogout,
      CGoogleLocal,
      CConnectGoogle,
    },
    SeasonApi: { RSeason },
    SchoolApi: {
      CSchools,
      RSchools,
      RSchool,
      USchoolClassroom,
      USchoolFormArchive,
    },
    RegistrationApi: { RRegistrations },
    EnrollmentApi: { REnrolllment, REnrolllments },
    FormApi: {
      CForm,
      RForms,
      RForm,
    },
    ArchiveApi: {
      RArchives,
    },
    NotificationApi: { CUpdatedNotifications, UCheckNotification },
  };
}