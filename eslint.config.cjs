const {defineConfig}=require('eslint/config');
const expo=require('eslint-config-expo/flat');
module.exports=defineConfig([expo,{ignores:['dist/**','qa/**']},{rules:{'react-hooks/exhaustive-deps':'warn'}}]);
