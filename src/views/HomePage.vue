<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<div class="top_section">
				<div class="bank_item">
					<p>Bank</p>
					<p style="font-size: 1rem;font-weight: 600;">${{numberWithCommas(dataBase.saved)}}</p>
				</div>
				<div class="buttons" style="position: absolute; right: 0%;top: 0px;" @click="showUserBox = !showUserBox">User</div>
			</div>
			<div class="bottom_section">
				<div class="buttons" style="position: absolute; right: 0%;top: 0px;" @click="showUserBox = !showUserBox">Add Goal</div>
				<div>
					<div v-for="(contents, goalID) of dataBase.goals" :key="goalID">

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
		</ion-content>
	</ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { initializeApp } from "firebase/app";
import { UserData } from "@/types"
import { onAuthStateChanged, Unsubscribe, User, getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut } from "firebase/auth";
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
			SignType: '',
			User: {} as User,
			userName: 'Netty',
			userEmail: 'nett@annette.co.nz',
			userPassword: 'HelloThere',
			userPasswordConfirm: 'HelloThere',
			passwordSetting: 'password',
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
		watchDataBase(){
			if(auth.currentUser != null){
				const uid = auth.currentUser.uid
				onSnapshot(doc(db, "data", uid), (doc) => {
					// @ts-expect-error: It's just a thing
					this.dataBase = doc.data()
					console.log(doc.data())
				});
			}
		},
		async userAction(){
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
					try {
						const userCredential = await createUserWithEmailAndPassword(auth, this.userEmail, this.userPassword)
						this.User = userCredential.user;
						await this.updateDisplayName()
						if(auth.currentUser != null){
							const uid = auth.currentUser.uid
							if(uid != undefined){
								try {
									await setDoc(doc(db, `data/${uid}`), {
										...{saved: 0, goals: {}}
									});
								} catch (error) {
									console.log(error)    
								}
							}
						}
					} catch (error) {
						console.log(error)
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
			num = `${num}`
			return ((parseFloat(num).toFixed(2)).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ","));
		},
	},
});
</script>

<style scoped>
p{
	margin: 0;
}
.top_section{
	position: absolute;
	height: 70px;
	width: 98%;
	left: 1%;
	top: 5px;
	border-bottom: 1px solid grey;
}

.bottom_section{
	position: absolute;
	height: calc(100% - 85px);
	width: 98%;
	left: 1%;
	bottom: 5px;
}
.buttons{
	border: 1px solid black;
	padding: 5px 25px;
	border-radius: 15px;
	background: radial-gradient(#00b8d8, #00d9ff);
}

.bank_item{
	border-radius: 4px;
    border: 1px solid black;
    width: 140px;
    height: 60px;
	padding: 5px;
	display: flex;
	align-items: center;
    justify-content: center;
	flex-direction: column;
	font-size: 0.9em;
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
