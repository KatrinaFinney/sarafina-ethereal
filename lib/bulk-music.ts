export const maxMusicBytes=50*1024*1024;
const audioTypes:Record<string,string>={mp3:'audio/mpeg',m4a:'audio/mp4',aac:'audio/aac',wav:'audio/wav',ogg:'audio/ogg',flac:'audio/flac',webm:'audio/webm'};
export function musicFileType(file:{name:string;type:string}) {
  const extension=file.name.split('.').pop()?.toLowerCase()||'';
  return audioTypes[extension]||(['audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/x-wav','audio/ogg','audio/flac','audio/webm'].includes(file.type)?file.type:'');
}
export function musicTitle(filename:string) {return filename.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim().slice(0,180)||'Untitled track';}
export type MusicTrack={key:string;file:File;title:string;note:string;preview:string;asset?:string;postId?:string;state:'ready'|'uploading'|'publishing'|'published'|'error';progress:number;error?:string;audience?:string};
type BatchActions={upload:(track:MusicTrack,onProgress:(percentage:number)=>void)=>Promise<string>;publish:(track:MusicTrack)=>Promise<string>;change:(track:MusicTrack)=>void};
// Keep successful uploads and publications when a later track fails.
export async function publishMusicBatch(tracks:MusicTrack[],audience:string,actions:BatchActions) {
  const result:MusicTrack[]=[];
  for(const original of tracks) {
    let track={...original};
    if(track.state==='published') {result.push(track);continue;}
    track={...track,error:undefined};
    try {
      if(!track.title.trim()) throw Error('Add a title for this track.');
      if(!musicFileType(track.file)||!track.file.size||track.file.size>maxMusicBytes) throw Error('Use a supported audio file under 50 MB.');
      track={...track,audience:track.audience||audience};
      if(!track.asset) {
        track={...track,state:'uploading',progress:0};actions.change({...track});
        const asset=await actions.upload(track,percentage=>{track={...track,progress:Math.min(100,Math.max(0,Math.round(percentage)))};actions.change({...track});});
        track={...track,asset,progress:100};
      }
      track={...track,state:'publishing'};actions.change({...track});
      const postId=await actions.publish(track);
      track={...track,postId,state:'published'};
    } catch(error) {track={...track,state:'error',error:error instanceof Error?error.message:'Please try this track again.'};}
    actions.change({...track});result.push(track);
  }
  return result;
}
