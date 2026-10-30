import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Easing,Platform,Pressable} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const Context=createContext({reduced:false,systemReduced:false,manual:false,setManual:(_value:boolean)=>{}});
export const useMotion=()=>useContext(Context);
export function MotionProvider({children}:{children:React.ReactNode}){
 const [systemReduced,setSystemReduced]=useState(true),[manual,setManualState]=useState(false);
 useEffect(()=>{AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduced).catch(()=>setSystemReduced(false));AsyncStorage.getItem('site-office-reduce-motion').then(v=>setManualState(v==='true')).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setSystemReduced);return()=>sub.remove();},[]);
 const setManual=(v:boolean)=>{setManualState(v);AsyncStorage.setItem('site-office-reduce-motion',String(v)).catch(()=>{});};
 return <Context.Provider value={{reduced:systemReduced||manual,systemReduced,manual,setManual}}>{children}</Context.Provider>;
}
const native=Platform.OS!=='web';
export function FadeIn({children,style,delay=0,testID}:{children:React.ReactNode,style?:any,delay?:number,testID?:string}){
 const {reduced}=useMotion(),value=useRef(new Animated.Value(reduced?1:0)).current;
 useEffect(()=>{if(reduced){value.stopAnimation();value.setValue(1);return;}value.setValue(0);const animation=Animated.timing(value,{toValue:1,duration:210,delay,easing:Easing.out(Easing.cubic),useNativeDriver:native,isInteraction:false});animation.start();return()=>animation.stop();},[reduced]);
 return <Animated.View testID={testID} style={[style,{opacity:value,transform:[{translateY:value.interpolate({inputRange:[0,1],outputRange:[7,0]})}]}]}>{children}</Animated.View>;
}
export function SoftPress({children,style,contentStyle,...props}:any){
 const {reduced}=useMotion(),scale=useRef(new Animated.Value(1)).current;
 const animate=(toValue:number)=>{scale.stopAnimation();if(reduced){scale.setValue(1);return;}Animated.spring(scale,{toValue,damping:22,stiffness:420,mass:.5,useNativeDriver:native,isInteraction:false}).start();};
 return <Pressable {...props} onPressIn={()=>animate(.97)} onPressOut={()=>animate(1)} style={style}><Animated.View style={[{transform:[{scale}],alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8},contentStyle]}>{children}</Animated.View></Pressable>;
}
export function RecordingWave(){const {reduced}=useMotion(),value=useRef(new Animated.Value(.55)).current;useEffect(()=>{if(reduced){value.setValue(.75);return;}const a=Animated.loop(Animated.sequence([Animated.timing(value,{toValue:1,duration:600,easing:Easing.inOut(Easing.sin),useNativeDriver:native,isInteraction:false}),Animated.timing(value,{toValue:.5,duration:600,easing:Easing.inOut(Easing.sin),useNativeDriver:native,isInteraction:false})]));a.start();return()=>a.stop();},[reduced]);return <Animated.View style={{height:35,flexDirection:'row',alignItems:'center',gap:5,transform:[{scaleY:value}]}}>{[10,18,27,34,23,15,31,24,16,9].map((height,i)=><Animated.View key={i} style={{height,width:3,borderRadius:3,backgroundColor:'#7b2cff'}}/>)}</Animated.View>;}
