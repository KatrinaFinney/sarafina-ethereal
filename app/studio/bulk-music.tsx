"use client";
import {useState,useRef,type FormEvent} from 'react';
import {upload} from '@vercel/blob/client';
import {maxMusicBytes,musicFileType,musicTitle,publishMusicBatch,type MusicTrack} from '@/lib/bulk-music';

export default function BulkMusic() {
  const [tracks,setTracks]=useState<MusicTrack[]>([]),[audience,setAudience]=useState('members'),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const running=useRef(false);
  const published=tracks.filter(track=>track.state==='published').length;
  const pending=tracks.filter(track=>track.state!=='published').length;
  function edit(key:string,values:Partial<MusicTrack>) {setTracks(current=>current.map(track=>track.key===key?{...track,...values}:track));}
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(running.current)return;running.current=true;setBusy(true);setStatus('Keep this tab open while your music uploads.');
    try {
      const result=await publishMusicBatch(tracks,audience,{
        change:track=>edit(track.key,track),
        upload:async(track,onProgress)=>{
          const filename=track.file.name.replace(/[^A-Za-z0-9_.-]/g,'_').slice(0,100)||'track';
          const blob=await upload('offerings/'+crypto.randomUUID()+'/'+filename,track.file,{access:'private',handleUploadUrl:'/api/upload',contentType:musicFileType(track.file),multipart:track.file.size>5*1024*1024,onUploadProgress:event=>onProgress(event.percentage)});
          return blob.pathname;
        },
        publish:async track=>{
          const data=new FormData();
          data.set('title',track.title.trim());data.set('body',track.note.trim()||'From my collection.');data.set('preview',track.preview.trim());data.set('kind','music');data.set('audience',track.audience!);data.set('asset',track.asset!);
          const response=await fetch('/api/publish',{method:'POST',body:data});
          const result=await response.json();if(!response.ok)throw Error(result.error||'Publishing failed. Try this track again.');return result.id;
        }
      });
      const complete=result.filter(track=>track.state==='published').length;
      setStatus(complete===result.length?'All '+complete+' tracks are published.':complete+' of '+result.length+' tracks published. Check the messages below and retry the remaining tracks.');
    } finally {running.current=false;setBusy(false);}
  }
  return <section className="bulk-music" aria-labelledby="bulk-title"><h2 id="bulk-title">Upload a collection.</h2><p>Select up to 20 songs, review their titles, and publish them together. Each file can be up to 50 MB.</p>
    <form onSubmit={submit}>
      <label htmlFor="bulk-files">Choose music files</label><input id="bulk-files" type="file" multiple accept=".mp3,.m4a,.aac,.wav,.ogg,.flac,.webm" disabled={busy||tracks.length>0} onChange={event=>{
        const files=Array.from(event.target.files||[]);event.target.value='';
        if(files.length>20){setStatus('Choose up to 20 tracks at a time.');return;}
        const invalid=files.filter(file=>!musicFileType(file)||!file.size||file.size>maxMusicBytes);
        if(invalid.length){setStatus('Check these files: '+invalid.map(file=>file.name).join(', ')+'. Use supported audio files under 50 MB.');return;}
        setTracks(files.map(file=>({key:crypto.randomUUID(),file,title:musicTitle(file.name),note:'',preview:'',state:'ready',progress:0})));setStatus('');
      }}/>
      {tracks.length>0&&<><label htmlFor="bulk-audience">Who can access these songs?</label><select id="bulk-audience" value={audience} onChange={event=>setAudience(event.target.value)} disabled={busy||tracks.some(track=>!!track.audience)}><option value="members">Paid All Access members</option><option value="free">Free & paid members — account required</option><option value="public">Everyone — no account required</option></select>
        <p className="studio-hint">Each song publishes as it finishes. Public songs are available immediately. Keep this tab open to retain progress and retry failed tracks.</p>
        <div className="bulk-tracks">{tracks.map((track,index)=><article className="bulk-track" key={track.key}>
          <div className="bulk-track-head"><strong>{index+1}. {track.file.name}</strong><span>{(track.file.size/1024/1024).toFixed(1)} MB</span></div>
          <label htmlFor={'track-title-'+track.key}>Track title</label><input id={'track-title-'+track.key} value={track.title} required maxLength={180} disabled={busy||!!track.audience} onChange={event=>edit(track.key,{title:event.target.value})}/>
          <details><summary>Note and public preview (optional)</summary><label htmlFor={'track-note-'+track.key}>Your note</label><textarea id={'track-note-'+track.key} value={track.note} maxLength={20000} disabled={busy||!!track.audience} onChange={event=>edit(track.key,{note:event.target.value})}/><label htmlFor={'track-preview-'+track.key}>Public preview</label><textarea id={'track-preview-'+track.key} value={track.preview} maxLength={400} disabled={busy||!!track.audience} onChange={event=>edit(track.key,{preview:event.target.value})}/></details>
          <div className="bulk-progress"><progress max={100} value={track.progress} aria-label={'Upload progress for '+track.title}/><span>{track.state==='uploading'?track.progress+'% uploaded':track.state==='publishing'?'Publishing…':track.state==='published'?'Published':track.state==='error'?'Needs attention':'Ready'}</span></div>
          {track.error&&<p className="bulk-error">{track.error}</p>}
          {!busy&&!track.audience&&<button type="button" className="text-link" onClick={()=>setTracks(current=>current.filter(item=>item.key!==track.key))}>Remove track</button>}
        </article>)}</div>
        <p>{published} published · {pending} remaining</p>
        {pending>0&&<button className="button" type="submit" disabled={busy}>{busy?'Uploading your collection…':tracks.some(track=>track.state==='error')?'Retry remaining tracks':'Publish '+pending+' tracks'}</button>}
        {!busy&&<button className="text-link" type="button" onClick={()=>{setTracks([]);setStatus('');}}>Start a new batch</button>}
        {published>0&&!busy&&<a className="text-link" href="/studio">Refresh published offerings</a>}
      </>}
      {status&&<p className="status" role="status">{status}</p>}
    </form>
  </section>;
}
