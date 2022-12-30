/**
 * @file User Page Tab Item - Basic
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

import { useState, useRef, useEffect } from "react";
import useDatabase from "hooks/useDatabase";

import style from "style/pages/admin/schools.module.scss";

// components
import Button from "components/button/Button";
import Input from "components/input/Input";
import Select from "components/select/Select";
import Popup from "components/popup/Popup";
import Table from "components/tableV2/Table";
import _ from "lodash";

type Props = {
  user: string;
  setPopupAcitve: any;
  schoolList: any;
  setIsUserListLoading: any;
};

function Basic(props: Props) {
  const database = useDatabase();
  const schoolSelectRef = useRef<any[]>([]);

  /* document fields */
  const [userId, setUserId] = useState<string>();
  const [userName, setUserName] = useState<string>();
  const [schools, setSchools] = useState<any[]>();
  const [schoolsText, setSchoolsText] = useState<string>();
  const [auth, setAuth] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [tel, setTel] = useState<string>();

  /* Popup Activation */
  const [isEditSchoolPopupActive, setIsEditSchoolPopupActive] =
    useState<boolean>(false);

  async function updateUser() {
    const result = database.U({
      location: `users/${props.user}`,
      data: {
        schools,
        auth,
        email,
        tel,
      },
    });
    return result;
  }

  async function getUser() {
    const res = await database.R({
      location: `users/${props.user}`,
    });
    return res;
  }

  useEffect(() => {
    console.log("auth is ", auth);
  }, [auth]);

  useEffect(() => {
    getUser()
      .then((res: any) => {
        setUserId(res.userId);
        setUserName(res.userName);
        setSchools(res.schools);
        setAuth(res.auth);
        setEmail(res.email);
        setTel(res.tel);
      })
      .catch((err: any) => alert(err.response.data.message));
  }, []);

  useEffect(() => {
    if (schools) {
      setSchoolsText(
        _.join(
          schools.map(
            (schoolData: any) =>
              `${schoolData.schoolName}(${schoolData.schoolId})`
          ),
          ", "
        )
      );
    }
  }, [schools]);

  return (
    <>
      <Popup
        closeBtn
        setState={props.setPopupAcitve}
        title={`${userName}(${userId})`}
        style={{ borderRadius: "4px" }}
      >
        <div className={style.popup}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "12px",
            }}
          >
            <Input
              label="소속 학교"
              defaultValue={schoolsText}
              appearence="flat"
              disabled
            />
            <Button
              type={"ghost"}
              onClick={() => {
                schoolSelectRef.current = [];
                setIsEditSchoolPopupActive(true);
              }}
              style={{
                borderRadius: "4px",
                height: "32px",
                boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
              }}
            >
              수정
            </Button>
          </div>

          <div style={{ marginTop: "24px" }}>
            {auth && (
              <Select
                appearence="flat"
                label="등급"
                required
                options={[
                  { text: "멤버", value: "member" },
                  { text: "매니저", value: "manager" },
                ]}
                defaultSelectedValue={auth}
                onChange={setAuth}
              />
            )}
          </div>
          <div style={{ marginTop: "24px" }}>
            <Input
              appearence="flat"
              label="이메일"
              defaultValue={email}
              onChange={(e: any) => setEmail(e.target.value)}
            />
          </div>
          <div style={{ marginTop: "24px" }}>
            <Input
              label="tel"
              defaultValue={tel}
              appearence="flat"
              onChange={(e: any) => setTel(e.target.value)}
            />
          </div>

          <div style={{ marginTop: "24px" }}>
            <Button
              type={"ghost"}
              onClick={() => {
                updateUser()
                  .then((res) => {
                    alert("success");
                    props.setIsUserListLoading(true);
                    props.setPopupAcitve(false);
                  })
                  .catch((err) => {
                    console.log(err);
                    alert(err.response.data.message);
                  });
              }}
              style={{
                borderRadius: "4px",
                height: "32px",
                boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
              }}
            >
              저장
            </Button>
          </div>
        </div>
      </Popup>
      {isEditSchoolPopupActive && (
        <Popup
          closeBtn
          setState={setIsEditSchoolPopupActive}
          title={`소속 학교 추가 및 삭제`}
          style={{ borderRadius: "4px" }}
        >
          <div className={style.popup}>
            <div className={style.row}>
              <Table
                type="object-array"
                data={props.schoolList}
                onChange={(value: any[]) => {
                  schoolSelectRef.current = _.filter(value, {
                    tableRowChecked: true,
                  });
                }}
                // checkFunction={(value) => {
                //   console.log("schools: ", schools, " value: ", value);
                //   return _.includes(
                //     schools.map((schoolData: any) => schoolData.school),
                //     value._id
                //   );
                // }}
                header={[
                  {
                    text: "선택",
                    key: "",
                    type: "checkbox",
                    width: "48px",
                  },
                  { text: "학교 ID", key: "schoolId", type: "text" },
                  { text: "학교 이름", key: "schoolName", type: "text" },
                ]}
              />
            </div>

            <div style={{ marginTop: "24px" }}>
              <Button
                type={"ghost"}
                disableOnclick
                onClick={() => {
                  setSchools([
                    ...schoolSelectRef.current.map((schoolData: any) => {
                      return {
                        school: schoolData._id,
                        schoolId: schoolData.schoolId,
                        schoolName: schoolData.schoolName,
                      };
                    }),
                  ]);
                  setIsEditSchoolPopupActive(false);
                }}
                style={{
                  borderRadius: "4px",
                  height: "32px",
                  boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
                }}
              >
                수정
              </Button>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

export default Basic;