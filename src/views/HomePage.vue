<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<div class="top_section">
				<div class="bank_item" @click="showEditBank = !showEditBank">
					<p>Bank:</p>
					<p style="font-size: 1rem;font-weight: 600;">${{numberWithCommas(dataBase.saved)}}</p>
				</div>
                <div class="bank_item">
					<p>Needed:</p>
					<p style="font-size: 1rem;font-weight: 600;">${{numberWithCommas(dataBase.saved - goalNeeded)}}</p>
				</div>
                <span class="material-icons-outlined" style="font-size:40px;" @click="showCreateGoal = !showCreateGoal">add_circle_outline</span>
                <span class="material-icons-outlined" style="font-size: 40px;" @click="showUserBox = !showUserBox">account_circle</span>
			</div>
			<div class="bottom_section">
				<div>
					<div v-for="(contents, goalID) of dataBase.goals" :key="goalID" class="goal_item">
                        <div style="display:flex; align-items: center;flex-direction: column;">
                            <h1>{{contents.name}}</h1>
                            <p style="font-size: 0.8em">Needed: ${{numberWithCommas(contents.amount)}}</p>
                        </div>
                        <div class="goal_item_bar" 
                        :style="{width: `${(Math.min(100 * Math.abs(contents.progress / contents.amount), 100))}%`}">
                        ${{numberWithCommas(contents.progress)}}</div>
					</div>
				</div>
			</div>

			<div v-if="showUserBox || !userSignIn" class="user_box">
				<div id="snackbar">The passwords don't match</div>
				<!-- User is not signed in -->
				<template v-if="!userSignIn"> 
					<form @submit.prevent="userAction()">
						<div class="signing_page" v-if="SignType == 'SignIn'">
							<p style="font-size: 1.5rem">Sign In</p>
							<div class="signing_page">
								<input type="email" placeholder="Email" required v-model="userEmail">
								<input :type="passwordSetting" placeholder="Password" required id="password" v-model="userPassword" minlength="8" autocomplete="off">
								<p style="color: #00F9FF;cursor: pointer">Forgot Your Password?</p>
							</div>
							<input class="class_button" type="submit" value="Sign In" style="padding: 0px;height: 50px;">
							<div>Don't have an account? <span style="color: #00F9FF;cursor: pointer" @click="SignType='CreateUser'">Create One!</span></div>
						</div>
						<div class="signing_page" v-if="SignType == 'CreateUser'">
							<p style="font-size: 1.5rem">Create User</p>
							<div class="signing_page">
								<input type="text" placeholder="Name" required v-model="userName" minlength="3" autocomplete="off">
								<input type="email" placeholder="Email" required v-model="userEmail">
								<input :type="passwordSetting" placeholder="Password" required id="password" v-model="userPassword" minlength="8" autocomplete="off">
								<input :type="passwordSetting" placeholder="Confirm Password" required id="confirm_password" v-model="userPasswordConfirm" minlength="8" autocomplete="off">
							</div>
							<input class="class_button" type="submit" value="Create User" style="padding: 0px;height: 50px;">
							<div>Already have an account? <span style="color: #00F9FF;cursor: pointer;" @click="SignType='SignIn'">Sign In!</span></div>
						</div>
					</form>
				</template>
				<template v-else>
					<div class="profile_page">
						<div class="top_section_profile">
							<div class="class_button" @click="signOutUser()">Sign Out</div>
							<div>Email: {{userEmail}}</div>
						</div>
					</div>
				</template>
			</div>
            <div v-if="showEditBank" class="user_box">
                <div class="user_input">
                    <input type="number" placeholder="Bank Amount" required v-model="dataBase.saved">
                    <input type="button" value="Save" @click="addToBank()">
                </div>
            </div>
            <div v-if="showCreateGoal" class="user_box">
                <div class="user_input">
                    <input type="text" placeholder="Name" required v-model="goalName">
                    <input type="number" placeholder="Goal Amount" required v-model="goalAmount">
                    <input type="number" placeholder="Currently Saved" required v-model="goalProgress">
                    <input type="button" value="Save" @click="addGoal()">
                </div>
            </div>
		</ion-content>
	</ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { initializeApp } from "firebase/app";
import { UserData } from "@/types"
import { onAuthStateChanged, Unsubscribe, User, getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, Auth } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, deleteField, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
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
			dataBase: {} as UserData,
			showUserBox: false,
			userSignIn: false,
			showEditBank: false,
			showCreateGoal: false,
            goalNeeded: 0,
			SignType: '',
			User: {} as User,
			userName: 'Netty',
			userEmail: '',
			userPassword: '',
			userPasswordConfirm: '',
			passwordSetting: 'password',
            currentUser: {} as User,
            goalName: '',
            goalAmount: '',
            goalProgress: '',
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
					this.watchDataBase()
				} else {
					// User is signed out
					this.userSignIn = false
					this.showUserBox = true
					this.SignType = 'SignIn'
				}
			});
		},
		async watchDataBase(){
			if(auth.currentUser != null){
				const uid = auth.currentUser.uid
				onSnapshot(doc(db, "data", uid), async (doc) => {
					// @ts-expect-error: It's just a thing
					this.dataBase = doc.data()
                    this.calcNeededAmount()
					console.log(doc.data())
				});
                this.currentUser = auth.currentUser as User
			}
		},
		async userAction(){
            try {
                if(this.SignType == 'SignIn'){
                    signInWithEmailAndPassword(auth, this.userEmail, this.userPassword)
                    .then((userCredential) => {
                        this.User = userCredential.user;
                    })
                    .catch((error) => {
                        //const errorCode = error.code;
                        const errorMessage = error.message;
                        console.log(errorMessage)
                    });
                    this.showUserBox = false
                }
                if(this.SignType == 'CreateUser'){
                    if(this.userPassword == this.userPasswordConfirm){
                        const userCredential = await createUserWithEmailAndPassword(auth, this.userEmail, this.userPassword)
                        this.User = userCredential.user;
                        await this.updateDisplayName()
                        if(auth.currentUser != null){
                            const uid = auth.currentUser.uid
                            if(uid != undefined){
                                await setDoc(doc(db, `data/${uid}`), {
                                    ...{saved: 0, goals: {}}
                                });
                            }
                        }
                        this.showUserBox = false
                    }else {
                        let x = document.getElementById("snackbar");
                        if(x != null)
                        x.className = "show";
                        setTimeout(function(){ 
                            if(x != null)
                            x.className = x.className.replace("show", ""); 
                        }, 3000);
                    }   
                }
            } catch (error) {
                console.log(error)
            }
		},
		async signOutUser(){
			await signOut(auth).then(() => {
				// Sign-out successful.
			}).catch((error) => {
				console.log(error)
				// An error happened.
			});
		},
		async updateDisplayName(){
			updateProfile(this.User, {
				displayName: this.userName
			}).then(() => {
				// Profile updated!
			}).catch((error) => {
				console.log(error)
			});
		},
		numberWithCommas(num: string | number) {
			num = parseFloat(`${num}`).toFixed(2)
			return (parseFloat(num).toLocaleString());
		},
        async addToBank(){
            const uid = this.currentUser.uid
            const docRef = doc(db, "data", uid);
            await updateDoc(docRef, {
                saved: this.dataBase.saved
            });
            this.showEditBank = false
        },
        async addGoal(){
            if(this.goalAmount == '' || this.goalAmount == '' || this.goalProgress == ''){
                return
            }
            const goalID = this.generateID(this.dataBase)
            const uid = this.currentUser.uid
            const docRef = doc(db, "data", uid);
            await updateDoc(docRef, {
                [`goals.${goalID}`]: {name: this.goalName, amount: this.goalAmount, progress: this.goalProgress}
            });
            this.showEditBank = false
        },
        generateID(check = {}, length = 8){
            if(length > 120){
                length = 120
            }
            const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            let is_duplicate = true;
            while(is_duplicate){
                //Generate an ID.
                for ( let i = 0; i < length; i++ ) {
                    result += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                //Check if it already exists. If so, generate again. If not, continue.
                if(typeof ([result, result, result, result, result, result, result, result, result, result, result, result].reduce((check: any, level) => check && check[level], check)) == 'undefined'){
                    is_duplicate = false;
                }
            }
            return result;
        },
        calcNeededAmount(){
            this.goalNeeded = 0
            for(const [goalID, contents] of Object.entries(this.dataBase.goals)){
                this.goalNeeded += contents.amount
            }
        }
	},
});
</script>

<style scoped>
p{
	margin: 0;
}
h1{
	margin: 0;
}
.top_section{
	position: absolute;
	height: 50px;
	width: 98%;
	left: 1%;
	top: 5px;
	border-bottom: 1px solid grey;
    display: flex;
    justify-content: space-between;
}

.bottom_section{
	position: absolute;
	height: calc(100% - 85px);
	width: 98%;
	left: 1%;
	bottom: 5px;
}

.bank_item{
    border-radius: 4px;
    height: 40px;
    padding: 5px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    font-size: 0.9em;
}

.user_input{
    border: 1px solid black;
    width: 100%;
    border-radius: 15px;
    display: flex;
    padding: 20px;
    flex-direction: column;
    gap: 17px;
    align-items: center;
    background: radial-gradient(#00b8d8, #00d9ff);
}

.goal_item{
    border: 1px solid black;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    padding: 5px;
    min-height: 50px;
}

.goal_item_bar{
    padding-left: 7px;
    height: 20px;
    background-color: #53b700;
    white-space: nowrap;
    display: flex;
    align-items: center;
}






.user_box{
    position: absolute;
    z-index: 100;
    overflow: scroll;
    top: 68px;
    left: 2px;
    right: 2px;
    bottom: 10px;
}
form {
    width: 100%;
    height: 100%;
    background-image: radial-gradient(circle, #880097, #470055);
    border-radius: 15px;
    border: 1px solid black;
    padding: 20px;
    color: white;
}
.signing_page{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 20px;
}

input{
    font-size: 17px;
    padding-left: 15px;
    border: 1px solid lightgrey;
    width: 30ch;
    height: 35px;
    border-radius: 25px;
    outline: none;
	color: black;
}

.class_button{
    border: 1px solid black;
    border-radius: 20px;
    padding: 10px;
    width: 20ch;
    background-color: white;
    color: black;
    cursor: pointer;
    user-select: none;
}

#snackbar {
    visibility: hidden;
    min-width: 250px;
    margin-left: -125px;
    background-color: #770000;
    color: #fff;
    text-align: center;
    border-radius: 2px;
    padding: 16px;
    position: fixed;
    z-index: 1;
    left: 50%;
    bottom: 30px;
    font-size: 17px;
}

#snackbar.show {
    visibility: visible;
    -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
    animation: fadein 0.5s, fadeout 0.5s 2.5s;
}

@-webkit-keyframes fadein {
    from {bottom: 0; opacity: 0;} 
    to {bottom: 30px; opacity: 1;}
}

@keyframes fadein {
    from {bottom: 0; opacity: 0;}
    to {bottom: 30px; opacity: 1;}
}

@-webkit-keyframes fadeout {
    from {bottom: 30px; opacity: 1;} 
    to {bottom: 0; opacity: 0;}
}

@keyframes fadeout {
    from {bottom: 30px; opacity: 1;}
    to {bottom: 0; opacity: 0;}
}
.profile_page{
    width: 100%;
    height: 100%;
    background-image: radial-gradient(circle, #880097, #470055);
    border-radius: 15px;
    border: 1px solid black;
	color: white;
}
</style>
