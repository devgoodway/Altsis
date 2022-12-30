/**
 * @file Form Index Page
 *
 * @author seedlessapple <luminousseedlessapple@gmail.com>
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
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import style from "style/pages/admin/forms.module.scss";

// hooks
import useDatabase from "hooks/useDatabase";
import useSearch from "hooks/useSearch";

import Button from "components/button/Button";
import Input from "components/input/Input";
import NavigationLinks from "components/navigationLinks/NavigationLinks";
import Popup from "components/popup/Popup";
import Select from "components/select/Select";
import Tab from "components/tab/Tab";
import Table from "components/table/Table";

import Svg from "assets/svg/Svg";
import useOutsideClick from "hooks/useOutsideClick";
import useApi from "hooks/useApi";

type Props = {};

/**
 * admin form page
 * @param props
 * @returns {JSX.Element} Forms Page
 */

const Forms = (props: Props) => {
  const database = useDatabase();
  const location = useLocation();
  const [formList, setFormList] = useState([]);
  const search = useSearch(formList);

  const [view, setView] = useState<"list" | "grid">("grid");

  const [addFormPopupActive, setAddFormPopupActive] = useState<boolean>(false);

  const [inputFormTitle, setInputFormTitle] = useState<string>("");
  const [selectFormType, setSelectFormType] = useState<string>();

  useEffect(() => {
    getForms();
  }, []);

  /**
   * fetches the form list from the database
   * @async
   * @returns {Array} list of forms
   */
  async function getForms() {
    const { forms: res } = await database.R({ location: "forms" });
    setFormList(res.reverse());
    return res;
  }

  /**
   * adds a new form to the database
   * @async
   * @return null
   */

  async function addForm() {
    await database
      .C({
        location: "forms",
        data: {
          title: inputFormTitle,
          type: selectFormType,
          data: [],
        },
      })
      .then(() => {
        getForms();
        setAddFormPopupActive(false);
      })
      .catch((error) => {
        if (error.response.status === 409) {
          alert("이미 존재하는 제목 입니다");
          setAddFormPopupActive(false);
        }
      });
  }

  /**
   * form item container
   * @param {any} data
   * @returns {JSX.Element} form item element
   */
  const FormItem = ({ data }: { data: any }): JSX.Element => {
    // console.log(R.RSchools());

    const navigate = useNavigate();
    const outsideclick = useOutsideClick();
    let fileColor;
    switch (data.type) {
      case "timetable":
        fileColor = "rgb(128, 128, 255)";
        break;
      case "evaluation":
        fileColor = "rgb(84, 255, 128)";
        break;
      case "syllabus":
        fileColor = "rgb(255, 128, 128)";
        break;
      case "print":
        fileColor = "rgb(255, 212, 94)";
        break;
      default:
        fileColor = "rgb(200, 200, 200)";
        break;
    }

    return (
      <>
        <div className={style.item} title={data.title}>
          <div
            className={style.icon}
            onClick={() => {
              navigate(data._id);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 315 415"
              width={"64px"}
              height={"64px"}
            >
              <path
                style={{
                  strokeMiterlimit: 10,
                  strokeWidth: "10px",
                  fillOpacity: 0.2,
                  fill: fileColor,
                  stroke: fileColor,
                }}
                d="M394.55,450h-300V50h200l100,100Z"
                transform="translate(-89.55 -45)"
              />
            </svg>
            <div
              className={style.type}
              style={{ color: fileColor }}
            >{`.${data.type.substring(0, 4)}`}</div>
          </div>
          <div className={style.info}>
            <span
              className={style.title}
              onClick={() => {
                navigate(data._id);
              }}
            >
              {data.title}
            </span>
            <span
              className={style.more}
              ref={outsideclick.RefObject}
              onClick={() => {
                outsideclick.setActive(true);
              }}
            >
              <Svg type={"verticalDots"} />
              {outsideclick.active &&
                (!data.archived ? (
                  <div className={style.menu}>
                    <div
                      className={style.menu_item}
                      onClick={() => {
                        database
                          .U({
                            location: `forms/${data._id}/archived`,
                            data: { new: true },
                          })
                          .then(() => {
                            getForms();
                          });
                      }}
                    >
                      보관 처리
                    </div>
                  </div>
                ) : (
                  <div className={style.menu}>
                    <div
                      className={style.menu_item}
                      onClick={() => {
                        database
                          .D({
                            location: `forms/${data._id}`,
                          })
                          .then(() => {
                            getForms();
                          });
                      }}
                    >
                      삭제
                    </div>
                    <div
                      className={style.menu_item}
                      onClick={() => {
                        database
                          .U({
                            location: `forms/${data._id}/archived`,
                            data: { new: false },
                          })
                          .then(() => {
                            getForms();
                          });
                      }}
                    >
                      복원
                    </div>
                  </div>
                ))}
            </span>
          </div>
        </div>
      </>
    );
  };

  /**
   *
   * @param {any[]} data
   * @returns {JSX.Element} a grid of form items
   */
  const FormItems = ({ type }: { type?: string }) => {
    return (
      <div className={style.content}>
        <div className={style.items}>
          {/* map from the back end */}
          {type !== "archived" && (
            <div
              className={style.item}
              onClick={() => {
                setAddFormPopupActive(true);
                setInputFormTitle("");
                setSelectFormType(
                  decodeURI(location.hash).replace("#", "") === "시간표"
                    ? "timetable"
                    : decodeURI(location.hash).replace("#", "") === "강의계획서"
                    ? "syllabus"
                    : // : decodeURI(location.hash).replace("#", "") === "평가"
                    // ? "evaluation"
                    decodeURI(location.hash).replace("#", "") === "출력"
                    ? "print"
                    : "other"
                );
              }}
              style={{ height: "160px" }}
            >
              <div className={style.icon} style={{ height: "100%" }}>
                <Svg type="plus" width="32px" height="32px" />
              </div>
            </div>
          )}
          {search
            .result()
            .filter((value: any) => {
              if (type === undefined && !value.archived) {
                return true;
              }
              if (type === "archived") {
                return value.archived === true;
              }
              return !value.archived && value.type === type;
            })
            .map((value: any, index: number) => {
              return <FormItem key={index} data={value} />;
            })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={style.section}>
        <NavigationLinks />
        <div className={style.title}>양식 관리</div>
        <div style={{ marginTop: "24px" }}>
          <Tab
            align={"flex-start"}
            items={{
              시간표: (
                <div style={{ marginTop: "24px" }}>
                  {view === "grid" ? (
                    <FormItems type={"timetable"} />
                  ) : (
                    <Table
                      type="object-array"
                      data={search.result().filter((value: any) => {
                        return (
                          value.type === "timetable" && value.archived === false
                        );
                      })}
                      header={[
                        { type: "index", key: "", text: "ID", width: "48px" },
                        { type: "string", key: "title", text: "제목" },
                        {
                          type: "string",
                          key: "type",
                          text: "종류",
                          width: "240px",
                        },
                      ]}
                    />
                  )}
                </div>
              ),
              강의계획서: (
                <div style={{ marginTop: "24px" }}>
                  {view === "grid" ? (
                    <FormItems type={"syllabus"} />
                  ) : (
                    <Table
                      type="object-array"
                      data={search.result().filter((value: any) => {
                        return (
                          value.type === "syllabus" && value.archived === false
                        );
                      })}
                      header={[
                        { type: "index", key: "", text: "ID", width: "48px" },
                        { type: "string", key: "title", text: "제목" },
                        {
                          type: "string",
                          key: "type",
                          text: "종류",
                          width: "240px",
                        },
                      ]}
                    />
                  )}
                </div>
              ),

              출력: (
                <div style={{ marginTop: "24px" }}>
                  {view === "grid" ? (
                    <FormItems type={"print"} />
                  ) : (
                    <Table
                      type="object-array"
                      data={search.result().filter((value: any) => {
                        return (
                          value.type === "print" && value.archived === false
                        );
                      })}
                      header={[
                        { type: "index", key: "", text: "ID", width: "48px" },
                        { type: "string", key: "title", text: "제목" },
                        {
                          type: "string",
                          key: "type",
                          text: "종류",
                          width: "240px",
                        },
                      ]}
                    />
                  )}
                </div>
              ),
              전체: (
                <div style={{ marginTop: "24px" }}>
                  {view === "grid" ? (
                    <FormItems />
                  ) : (
                    <Table
                      type="object-array"
                      data={search.result()}
                      header={[
                        { type: "index", key: "", text: "ID", width: "48px" },
                        { type: "string", key: "title", text: "제목" },
                        {
                          type: "string",
                          key: "type",
                          text: "종류",
                          width: "240px",
                        },
                      ]}
                    />
                  )}
                </div>
              ),
              보관됨: (
                <div style={{ marginTop: "24px" }}>
                  {view === "grid" ? (
                    <FormItems type={"archived"} />
                  ) : (
                    <Table
                      type="object-array"
                      data={search.result().filter((value: any) => {
                        return value.archived === true;
                      })}
                      header={[
                        { type: "index", key: "", text: "ID", width: "48px" },
                        { type: "string", key: "title", text: "제목" },
                        {
                          type: "string",
                          key: "type",
                          text: "종류",
                          width: "240px",
                        },
                      ]}
                    />
                  )}
                </div>
              ),
            }}
          >
            <div
              className={style.search}
              style={{ margin: "24px 0", display: "flex" }}
            >
              <Input
                placeholder={"제목으로 검색"}
                defaultValue={
                  search.filters.filter((val) => val.id === "search")[0]?.value
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  search.addFilterItem({
                    id: "search",
                    key: "title",
                    operator: "=",
                    value: e.target.value,
                  });
                }}
              />
              <div className={style.btns}>
                <div
                  className={`${style.btn} ${view === "grid" && style.active}`}
                  onClick={() => {
                    setView("grid");
                  }}
                >
                  <Svg type="grid" width="20px" height="20px" />
                </div>
                <div
                  className={`${style.btn} ${view === "list" && style.active}`}
                  onClick={() => {
                    setView("list");
                  }}
                >
                  <Svg type="list" width="26px" height="26px" />
                </div>
              </div>
            </div>
          </Tab>
        </div>
      </div>
      {addFormPopupActive && (
        <Popup
          setState={setAddFormPopupActive}
          title="양식 추가"
          footer={
            <Button
              disabled={inputFormTitle === ""}
              disableOnclick
              onClick={() => {
                addForm().catch((err) => {
                  console.log(err);
                });
                setAddFormPopupActive(false);
              }}
            >
              추가
            </Button>
          }
        >
          <div
            style={{
              marginTop: "12px",
            }}
          >
            <Input
              label="제목"
              required
              onChange={(e: any) => {
                setInputFormTitle(e.target.value);
              }}
            />
          </div>

          <div className={style.select_form}>
            <div
              className={`${style.form} ${
                selectFormType === "timetable" && style.active
              }`}
              onClick={() => {
                setSelectFormType("timetable");
              }}
            >
              시간표
            </div>
            <div
              className={`${style.form} ${
                selectFormType === "syllabus" && style.active
              }`}
              onClick={() => {
                setSelectFormType("syllabus");
              }}
            >
              강의계획서
            </div>
            <div
              className={`${style.form} ${
                selectFormType === "print" && style.active
              }`}
              onClick={() => {
                setSelectFormType("print");
              }}
            >
              출력
            </div>
          </div>
        </Popup>
      )}
    </>
  );
};

export default Forms;