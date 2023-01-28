/**
 * @file Courses View Page
 *
 * more info on selected courses
 *
 * @author jessie129j <jessie129j@gmail.com>
 *
 * -------------------------------------------------------
 *
 * IN PRODUCTION
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
 * @version 1.0
 *
 */
import { useEffect, useState, useRef } from "react";
import useDatabase from "hooks/useDatabase";
import { useAuth } from "contexts/authContext";

import style from "style/pages/courses/course.module.scss";

// components
import Divider from "components/divider/Divider";
import Popup from "components/popup/Popup";
import Table from "components/tableV2/Table";

import EditorParser from "editor/EditorParser";

import _ from "lodash";
import Button from "components/button/Button";
type Props = {
  setPopupActive: any;
  courseData: any;
  setIsEnrollmentListLoading: any;
};

const EnrollBulkPopup = (props: Props) => {
  const { currentSeason, currentRegistration } = useAuth();
  const database = useDatabase();

  const [registrationList, setRegistrationList] = useState<any[]>();
  const selectRef = useRef<any[]>([]);

  const [selectPopupActive, setSelectPopupActive] = useState<boolean>(true);
  const [resultPopupActive, setResultPopupActive] = useState<boolean>(false);

  const [enrollments, setEnrollments] = useState<any[]>();

  async function getRegistrationList() {
    const { registrations } = await database.R({
      location: `registrations?season=${props.courseData.season}`,
    });

    return registrations;
  }

  async function enrollBulk() {
    const { enrollments } = await database.C({
      location: `enrollments/bulk`,
      data: {
        registration: currentRegistration._id,
        syllabus: props.courseData._id,
        students: selectRef.current.map((registration: any) => {
          return {
            userId: registration.userId,
            userName: registration.userName,
            grade: registration.grade,
          };
        }),
      },
    });

    return enrollments;
  }

  useEffect(() => {
    getRegistrationList().then((res: any) => {
      setRegistrationList(res);
    });
    return () => {};
  }, []);

  return (
    <>
      {selectPopupActive && (
        <Popup
          setState={props.setPopupActive}
          closeBtn
          title={"초대할 학생 선택"}
          contentScroll
          footer={
            <Button
              type="ghost"
              onClick={() => {
                if (selectRef.current.length === 0) {
                  alert("초대할 학생을 선택해주세요.");
                } else {
                  enrollBulk()
                    .then((res: any) => {
                      setEnrollments(res);
                      setResultPopupActive(true);
                    })
                    .catch((err: any) => alert(err.response.data.message));
                }
              }}
            >
              선택
            </Button>
          }
        >
          <Table
            data={registrationList || []}
            type="object-array"
            control
            defaultPageBy={50}
            onChange={(value: any[]) => {
              selectRef.current = _.filter(value, {
                tableRowChecked: true,
              });
            }}
            header={[
              {
                text: "checkbox",
                key: "",
                type: "checkbox",
                width: "48px",
              },
              {
                text: "역할",
                key: "role",
                textAlign: "center",
                type: "status",
                status: {
                  teacher: { text: "선생님", color: "blue" },
                  student: { text: "학생", color: "orange" },
                },
              },
              {
                text: "ID",
                key: "userId",
                type: "text",
                textAlign: "center",
              },
              {
                text: "이름",
                key: "userName",
                type: "text",
                textAlign: "center",
              },

              {
                text: "학년",
                key: "grade",
                type: "text",
                textAlign: "center",
              },
              {
                text: "그룹",
                key: "group",
                type: "text",
                textAlign: "center",
              },
              {
                text: "선생님 ID",
                key: "teacherId",
                type: "text",
                textAlign: "center",
              },
              {
                text: "선생님 이름",
                key: "teacherName",
                type: "text",
                textAlign: "center",
              },
            ]}
          />
        </Popup>
      )}
      {resultPopupActive && (
        <Popup
          setState={props.setPopupActive}
          closeBtn
          title={"초대 결과"}
          contentScroll
          footer={
            <Button
              type="ghost"
              onClick={() => {
                props.setIsEnrollmentListLoading(true);
                setResultPopupActive(false);
                props.setPopupActive(false);
              }}
            >
              확인
            </Button>
          }
        >
          <Table
            data={enrollments || []}
            type="object-array"
            control
            defaultPageBy={50}
            header={[
              {
                text: "No",
                type: "text",
                key: "tableRowIndex",
                width: "48px",
                textAlign: "center",
              },
              {
                text: "ID",
                key: "userId",
                type: "text",
                textAlign: "center",
              },
              {
                text: "이름",
                key: "userName",
                type: "text",
                textAlign: "center",
              },

              {
                text: "학년",
                key: "grade",
                type: "text",
                textAlign: "center",
              },

              {
                text: "결과",
                key: "success.status",
                textAlign: "center",
                type: "status",
                status: {
                  true: { text: "성공", color: "green" },
                  false: { text: "실패", color: "red" },
                },
              },
              {
                text: "",
                key: "success.message",
                type: "text",
                textAlign: "center",
              },
            ]}
          />
        </Popup>
      )}
    </>
  );
};

export default EnrollBulkPopup;