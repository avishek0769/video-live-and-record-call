class PeerService {
    constructor() { // This creates the connection to the stun/ice servers
        if (!this.peer) {
            fetch("https://z1v3k1h4-3000.inc1.devtunnels.ms/ice-servers").then(res => res.json())
            .then(data => {
                console.log("IceServers --> ", data)
                this.peer = new RTCPeerConnection({
                    iceServers: data.iceServers
                })
            })
        }
    }
    /* 
    *** AS PER MY INVESTIGATION ***
    The system which is generating an offer, needs to set the offer in their local. Since, they are creating the offer, they will 
    receive an answer which is coming from the remote. So we have another function just to set the answer in the remote, because at
    the initial stage the answer is not with us.
    But, the person who is getting the offer he has access to both the offer and the answer (which he will be creating). So from their
    POV, answer is their local and the offer is remote. So they set them accordingly
    */
    async getOffer() {
        if (this.peer) {
            const offer = await this.peer.createOffer()
            await this.peer.setLocalDescription(new RTCSessionDescription(offer))
            return offer;
        }
    }

    async getAnswer(offer) {
        if (this.peer) {
            // if(this.peer.signalingState !== 'stable'){
                await this.peer.setRemoteDescription(offer)
            // }
            const ans = await this.peer.createAnswer()
            await this.peer.setLocalDescription(new RTCSessionDescription(ans))
            return ans;
        }
    }

    async setRemoteDescription(ans) {
        if (this.peer) {
            await this.peer.setRemoteDescription(new RTCSessionDescription(ans))
        }
    }
}

export default new PeerService()