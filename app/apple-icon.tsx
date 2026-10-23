import { ImageResponse } from "next/og";
export const size={width:180,height:180};
export const contentType="image/png";
export default function Icon(){return new ImageResponse(<div style={{width:"100%",height:"100%",background:"#0A1128",color:"#C5A880",display:"flex",alignItems:"center",justifyContent:"center",fontSize:96,borderRadius:35}}>↗</div>,size);}
