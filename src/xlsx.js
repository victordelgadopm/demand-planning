/* Minimal in-browser .xlsx writer (no libraries, works offline). Sheets: {name,widths,rows,filter,freeze}. Cell: {v,s} or plain value. */
(function(){
'use strict';
const T=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0}
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
const enc=new TextEncoder();
function zip(files){
  const parts=[],cen=[];let off=0;
  for(const f of files){
    const nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;
    const lh=new Uint8Array(30+nm.length),dv=new DataView(lh.buffer);
    dv.setUint32(0,0x04034b50,true);dv.setUint16(4,20,true);dv.setUint16(6,0x0800,true);dv.setUint16(8,0,true);dv.setUint16(10,0,true);dv.setUint16(12,0x21,true);
    dv.setUint32(14,crc,true);dv.setUint32(18,sz,true);dv.setUint32(22,sz,true);dv.setUint16(26,nm.length,true);dv.setUint16(28,0,true);lh.set(nm,30);
    parts.push(lh,f.data);
    const ch=new Uint8Array(46+nm.length),cv=new DataView(ch.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(10,0,true);cv.setUint16(12,0,true);cv.setUint16(14,0x21,true);
    cv.setUint32(16,crc,true);cv.setUint32(20,sz,true);cv.setUint32(24,sz,true);cv.setUint16(28,nm.length,true);cv.setUint32(42,off,true);ch.set(nm,46);
    cen.push(ch);off+=lh.length+sz;
  }
  const cs=cen.reduce((a,b)=>a+b.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,cs,true);ev.setUint32(16,off,true);
  return new Blob([...parts,...cen,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const X=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
const col=i=>{let s='';for(i++;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s};
/* style ids */
const S={def:0,head:1,txt:2,money:3,dec1:4,int:5,t_risk:6,t_med:7,t_watch:8,t_much:9,t_ok:10,title:11,note:12,bold:13,boxT:14,boxN:15,boxS:16,pick:17,label:18,money0:19,ctr:20,pct:21,pctS:22,money2:23,x2:24,boxN1:25,boxPct:26,boxPctS:27,sect:28,inp:29,headIn:30};
const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="9"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0"/><numFmt numFmtId="165" formatCode="0.0"/><numFmt numFmtId="166" formatCode="&quot;$&quot;#,##0&quot; at stake&quot;"/><numFmt numFmtId="167" formatCode="&quot;$&quot;#,##0;-&quot;$&quot;#,##0;&quot;-&quot;"/><numFmt numFmtId="168" formatCode="+0%;-0%;0%"/><numFmt numFmtId="169" formatCode="&quot;$&quot;#,##0.00"/><numFmt numFmtId="170" formatCode="0.00&quot;x&quot;"/><numFmt numFmtId="171" formatCode="0.0%"/><numFmt numFmtId="172" formatCode="+0.0%;-0.0%;0.0%"/></numFmts>
<fonts count="13"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF1F3864"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF595959"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF842029"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF8A4B08"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF4B2E83"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF0B4F7C"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF1E5E24"/><name val="Calibri"/></font><font><b/><sz val="24"/><color rgb="FF1F3864"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF1F3864"/><name val="Calibri"/></font><font><sz val="10"/><color rgb="FF595959"/><name val="Calibri"/></font></fonts>
<fills count="12"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F3864"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8D7DA"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE5B4"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE5DCF5"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD6EAF8"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDDF0DE"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F5FA"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3F2E1"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2E7D32"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD0D5DD"/></left><right style="thin"><color rgb="FFD0D5DD"/></right><top style="thin"><color rgb="FFD0D5DD"/></top><bottom style="thin"><color rgb="FFD0D5DD"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="31">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="right"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="right"/></xf>
<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="right"/></xf>
<xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="6" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="7" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="8" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="9" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="11" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="3" fontId="10" fillId="8" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="166" fontId="12" fillId="8" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="9" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1" applyProtection="1"><alignment horizontal="center" vertical="center"/><protection locked="0"/></xf>
<xf numFmtId="0" fontId="11" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="167" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="right"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="center" wrapText="1"/></xf>
<xf numFmtId="9" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="right"/></xf>
<xf numFmtId="168" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="right"/></xf>
<xf numFmtId="169" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="right"/></xf>
<xf numFmtId="170" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="right"/></xf>
<xf numFmtId="165" fontId="10" fillId="8" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="171" fontId="10" fillId="8" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="172" fontId="10" fillId="8" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="11" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="10" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1" applyProtection="1"><alignment vertical="top" wrapText="1"/><protection locked="0"/></xf>
<xf numFmtId="0" fontId="1" fillId="11" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="6"><dxf><font><b/><color rgb="FF842029"/></font><fill><patternFill><bgColor rgb="FFF8D7DA"/></patternFill></fill></dxf><dxf><font><b/><color rgb="FF8A4B08"/></font><fill><patternFill><bgColor rgb="FFFFE5B4"/></patternFill></fill></dxf><dxf><font><b/><color rgb="FF4B2E83"/></font><fill><patternFill><bgColor rgb="FFE5DCF5"/></patternFill></fill></dxf><dxf><font><b/><color rgb="FF0B4F7C"/></font><fill><patternFill><bgColor rgb="FFD6EAF8"/></patternFill></fill></dxf><dxf><font><b/><color rgb="FF1E5E24"/></font><fill><patternFill><bgColor rgb="FFDDF0DE"/></patternFill></fill></dxf><dxf><fill><patternFill><bgColor rgb="FFFFE699"/></patternFill></fill></dxf></dxfs></styleSheet>`;
function sheetXml(sh){
  const rows=sh.rows,nc=Math.max(1,...rows.map(r=>r.length));
  let x=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${(sh.tab||sh.fit)?`<sheetPr>${sh.tab?`<tabColor rgb="${sh.tab}"/>`:''}${sh.fit?'<pageSetUpPr fitToPage="1"/>':''}</sheetPr>`:''}<sheetViews><sheetView workbookViewId="0"${sh.first?' tabSelected="1"':''}${sh.noGrid?' showGridLines="0"':''}>`;
  if(sh.freeze||sh.freezeCols){const xs=sh.freezeCols||0,ys=sh.freeze||0;x+=`<pane${xs?` xSplit="${xs}"`:''}${ys?` ySplit="${ys}"`:''} topLeftCell="${col(xs)}${ys+1}" activePane="${xs&&ys?'bottomRight':xs?'topRight':'bottomLeft'}" state="frozen"/>`}
  x+=`</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>`;
  if(sh.widths)x+='<cols>'+sh.widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"${(sh.hide||[]).includes(i)?' hidden="1"':''}/>`).join('')+'</cols>';
  x+='<sheetData>';
  rows.forEach((r,ri)=>{
    x+=`<row r="${ri+1}"${r.h?` ht="${r.h}" customHeight="1"`:''}>`;
    r.forEach((c,ci)=>{
      if(c==null||c==='')return;
      const o=(typeof c==='object')?c:{v:c},ref=col(ci)+(ri+1),s=o.s==null?'':` s="${S[o.s]!=null?S[o.s]:o.s}"`;
      if(o.f){const fv=o.v;x+=(typeof fv==='number'&&isFinite(fv))?`<c r="${ref}"${s}><f>${X(o.f)}</f><v>${fv}</v></c>`:`<c r="${ref}"${s} t="str"><f>${X(o.f)}</f><v>${X(fv==null?'':fv)}</v></c>`;return}
      if((o.v==null||o.v==='')&&o.s!=null){x+=`<c r="${ref}"${s}/>`;return}
      if(typeof o.v==='number'&&isFinite(o.v))x+=`<c r="${ref}"${s}><v>${o.v}</v></c>`;
      else x+=`<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${X(o.v)}</t></is></c>`;
    });
    x+='</row>';
  });
  x+='</sheetData>';
  if(sh.prot)x+='<sheetProtection sheet="1" objects="1" scenarios="1" formatColumns="0" formatRows="0"'+(sh.filter?' autoFilter="0" sort="0"':'')+'/>';
  if(sh.filter){const last=sh.filter;x+=`<autoFilter ref="A1:${col(nc-1)}${last}"/>`}
  if(sh.merges&&sh.merges.length)x+=`<mergeCells count="${sh.merges.length}">${sh.merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`;
  let pr=1;
  (sh.cf||[]).forEach(c=>{x+=`<conditionalFormatting sqref="${c.ref}">${c.rules.map(r=>`<cfRule type="${r.type}" dxfId="${r.dxf}" priority="${pr++}"${r.op?` operator="${r.op}"`:''}><formula>${X(r.formula)}</formula></cfRule>`).join('')}</conditionalFormatting>`});
  if(sh.dv&&sh.dv.length)x+=`<dataValidations count="${sh.dv.length}">${sh.dv.map(d=>`<dataValidation type="list" allowBlank="0" showInputMessage="1" showErrorMessage="1" promptTitle="${X(d.title||'')}" prompt="${X(d.prompt||'')}" sqref="${d.ref}"><formula1>${X(d.list)}</formula1></dataValidation>`).join('')}</dataValidations>`;
  if(sh.fit)x+='<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>';
  return x+'</worksheet>';
}
function build(sheets){
  sheets=sheets.map((s,i)=>({...s,first:i===0}));
  const f=[];
  const add=(n,t)=>f.push({name:n,data:enc.encode(t)});
  add('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  add('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  add('xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${X(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`);
  add('xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  add('xl/styles.xml',styles);
  sheets.forEach((s,i)=>add(`xl/worksheets/sheet${i+1}.xml`,sheetXml(s)));
  return zip(f);
}
window.MiniXlsx={build,col};
})();
