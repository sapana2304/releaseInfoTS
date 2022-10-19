import React,{ useRef } from "react";
import AWS  from 'aws-sdk'
import * as XLSX from "xlsx";
//import PutData from './PutData';
import 'antd/dist/antd.css';
import { message } from 'antd';
import { isAnyArrayBuffer } from "util/types";
import { PutObjectRequest } from "aws-sdk/clients/s3";
import PutData from './PutData';


window.Buffer = window.Buffer || require("buffer").Buffer;

const Upload  = () => {

const fileInput = useRef<HTMLInputElement>(null);
const releaseInput = useRef<HTMLInputElement | null>(null);
let fileName:any, newFileName: string , fileext, file:any , filetype:any;




const handleClick = (event: { preventDefault: () => void; }) =>{
event.preventDefault();
let filelist = fileInput?.current?.files;
let releaseNumber = releaseInput.current?.value 

console.log("----------",filelist)
for (var i = 0; i < filelist!.length; i++) {
     fileName = filelist![i].name;
     filetype = filelist![i].type
     fileext = fileName.split(".").pop();
     newFileName = fileName.substring(0, fileName.lastIndexOf('.'))+"_"+releaseNumber+"."+fileext;
    file =  filelist![i]
}

console.log("---------------------",file)

//Set the AWS Config to connect s3 bucket
const config = {
    bucketName: process.env.REACT_APP_BUCKET_NAME,
    region: process.env.REACT_APP_REGION,
    accessKeyId: process.env.REACT_APP_ACCESS,
    secretAccessKey: process.env.REACT_APP_SECRET
}
AWS.config.update({
  accessKeyId: process.env.REACT_APP_ACCESS,
  secretAccessKey: process.env.REACT_APP_SECRET,
  region:  process.env.REACT_APP_REGION,
});

const s3 = new AWS.S3();
  
  try {
      const params = {
        Bucket: process.env.REACT_APP_BUCKET_NAME,
        Key: newFileName,
        ContentType: file.type,
        Body: file
      }
  
      const res = s3.putObject(params as PutObjectRequest).promise() .then(() => {
        
        // After SucessFully Upload into s3 Bucket Read exel file
        const reader = new FileReader();
        reader.onload = (evt) => {

          let Heading = [
                 ["docId", "profitCenter", "costCenter","CashjournalNo","releaseId"],
               ];
 
           const bstr = evt.target!.result;
           const wb = XLSX.read(bstr, { type: "binary" });
           const wsname = wb.SheetNames[0];
           const ws = wb.Sheets[wsname];
           XLSX.utils.sheet_add_aoa(ws, Heading);
        
          const data = XLSX.utils.sheet_to_json(ws);
         
          //Calling Function dynamoDB 
           addDataToDynamoDB(releaseNumber,data).then(
 
             //fileInput.current.value = "",
             //releaseInput.current.value = "",
 
             message.success("Suceessfully Process the File !!")
 
           ).catch()
         };
         reader.readAsBinaryString(file);
         
     })
    .catch((err) => {

        
    });
  
    } catch (error) {
      console.log(error);
      return;
    }

    //Call DynamoDB function 
    const addDataToDynamoDB = async (releasedata:any,data:any) => {
      await PutData(releasedata,data)
    }

    //Read Excel File to Put into dynamo DB
    


};

 return(
        <div>
    <form className="register-form" onSubmit={ handleClick }>
         <input
          id="release-no"
          className="form-field"
          type="number" min="1" max="10000"
          placeholder="Release Number"
          name="releaseno"
          ref={releaseInput}
           required

          />
        <input
          id="fileupload"
          className="form-field"
          type="file"
          placeholder="Upload File"
          name="fileupload"
          ref={fileInput}
          required
          
        />
       
        <button className="form-field" type="submit">
          submit
        </button>
      </form>

        </div>
    )
}



export default Upload
