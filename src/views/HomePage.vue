<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <div class="top_section">
                <div class="buttons" style="position: absolute; right: 0%;" @click="showUserBox = !showUserBox">User</div>
            </div>
            <div class="bottom_section"></div>
        </ion-content>
    </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { initializeApp } from "firebase/app";
import { onAuthStateChanged, Unsubscribe, User, getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, deleteField, arrayUnion, arrayRemove } from "firebase/firestore";
const firebaseConfig = {
	apiKey: "AIzaSyBQoRcJvWt7rw-Ds7XjnNLC0dKBGLmWofA",
    authDomain: "goalie-ee623.firebaseapp.com",
    projectId: "goalie-ee623",
    storageBucket: "goalie-ee623.appspot.com",
    messagingSenderId: "472282524212",
    appId: "1:472282524212:web:d85c06f7b64b0e62df7861",
    measurementId: "G-75RHSN2EZV"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export default defineComponent({
    name: 'HomePage',
    components: {
        IonContent,
        IonPage
    },
    data(){
        return{
            showUserBox: false,
            userSignIn: false,
            SignType: '',
            User: {} as User,
            userEmail: '',
        }
    },
    mounted(){
        this.authListener()
    },
    methods: {
        authListener(){
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    this.userSignIn = true
                    this.showUserBox = false
                    this.SignType = ''
                    this.User = user
                    if(user.email != null){
                        this.userEmail = user.email
                    }
                } else {
                    // User is signed out
                    this.userSignIn = false
                    this.showUserBox = true
                    this.SignType = 'SignIn'
                }
            });
        },
    },
});
</script>

<style scoped>
.top_section{
    position: absolute;
    border: 1px solid black;
    height: 60px;
    width: 98%;
    left: 1%;
    top: 5px;
}

.bottom_section{
    position: absolute;
    border: 1px solid black;
    height: calc(100% - 75px);
    width: 98%;
    left: 1%;
    bottom: 5px;
}
.buttons{
    border: 1px solid black;
    padding: 5px 25px;
    border-radius: 5px;
    background: radial-gradient(#00b8d8, #00d9ff);
}
</style>
