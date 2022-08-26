import React from 'react'

type Props = {}

const Divider = (props: Props) => {
  return (
    <div
    style={{
      width: "100%",
      border:"var(--border-default)",
      margin: "12px 0",
    }}
  ></div>
  )
}

export default Divider