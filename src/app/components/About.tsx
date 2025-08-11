export default function About() {
    
    return (
      <>
      <section id="about" className="mb-8">
        <h2 className="text-xl font-bold">about</h2>
        <p className=" text-sm  mt-2">
          <b>(B.S) Computer Science</b> with a minor in <b>Tech Management</b> at UC Davis
        </p>
        <p className=" text-sm  mt-2">
          <b>Other Hobbies:</b> Video Editing, Cool ChatGPT Prompts, 3D-Modeling, Streaming, Badminton
        </p>
        <div className=" text-sm mt-4 flex space-x-4 text-blue-500 underline">
        <a
  className="flex gap-2"
  href="https://drive.google.com/drive/folders/12cTsJccyvpVwrejRO2R2o7JuhABW4uVC?usp=sharing"
  target="_blank"
  rel="noopener noreferrer"
>
  resume
</a>
<a
  href="https://www.linkedin.com/in/thai-an-le/"
  target="_blank"
  rel="noopener noreferrer"
>
  linkedin
</a>
<a
  href="https://github.com/xntle"
  target="_blank"
  rel="noopener noreferrer"
>
  github
</a>
<a
  href="https://www.youtube.com/@_xntle"
  target="_blank"
  rel="noopener noreferrer"
>
  youtube
</a>
<a
  href="https://www.twitch.tv/xntle"
  target="_blank"
  rel="noopener noreferrer"
>
  twitch
</a>

        </div>
      </section>
      </>
    );
  }