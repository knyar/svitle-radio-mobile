/** @flow */

import Reflux from 'reflux';

export var Actions = Reflux.createActions([
  "updateMetadata",
]);

export class MetadataStore extends Reflux.Store {
  update: Function;
  periodic: Function;
  schedule: Function;
  timer: number;

  state = {
    streamUrl: "",
    current: "",
    next: "",
    flags: [],
    lastUpdated: 0,
  };

  constructor(props: Object) {
    super(props);
    this.update = this.update.bind(this);
    this.periodic = this.periodic.bind(this);
    this.listenTo(Actions.updateMetadata, this.update);
    this.periodic();
  }
  periodic() {
    this.update();
    this.schedule(60000);  // reschedule in 60 seconds by default.
  }
  schedule(interval: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.periodic()
    }, interval);
  }
  componentWillUnmount() {
    clearTimeout(this.timer);
  }
  update() {
    console.log("MetadataStore.update triggered");
    var ts = Date.now();
    if (ts - this.state.lastUpdated < 5000) {
      console.log("Metadata last updated less than 5 seconds ago, skipping")
      this.schedule(5000); // schedule next update in 5 seconds.
      return
    }

    fetch("https://m.svitle.org/nowplaying.php")
    .then((response) => response.json())
    .then((responseData) => {
      this.setState({
        streamUrl: responseData.stream_url,
        current: responseData.current || "",
        next: responseData.next || "",
        flags: (responseData.flags || "").split(":"),
        lastUpdated: ts,
      });
    })
    .catch((error) => {
      console.log("Error fetching nowplaying: " + error);
      this.setState({
        current: "",
        next: "",
      });
      this.schedule(2000 + 1000 * Math.random()); // retry in 2-3 seconds
    });
  }
}
