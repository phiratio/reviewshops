import axios from 'axios';
import {$} from './bling';

function ajaxHeart(e) {
    e.preventDefault();
    console.log('hearted it ;) <3');
    console.log(this);
    axios
        .post(this.action)
        .then(res => {
            //this is the form tab heart is sub element with the name="heart"
            //console.log(res.data);
            const isHearted = this.heart.classList.toggle('heart__button--hearted');
            $('.heart-count').textContent = res.data.hearts.length;
            if (isHearted) {
                this.heart.classList.add('heart__button--float');
                setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500);
            }
        })
        .catch(console.error);
}

export default ajaxHeart