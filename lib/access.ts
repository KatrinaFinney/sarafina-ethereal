/** Public previews never include protected post bodies or file URLs. */
export function canAccessPost(audience:string,signedIn:boolean,paid:boolean){
 if(audience==='public')return true;
 if(audience==='free')return signedIn;
 if(audience==='members')return signedIn&&paid;
 return false;
}
